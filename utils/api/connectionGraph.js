/**
 * Connection Graph - Build and traverse connection networks
 * 
 * Implements six-degrees-of-separation path finding
 * using BFS graph traversal.
 */

import { supabase } from '../../lib/supabase';

/**
 * Build an adjacency graph from connections
 * 
 * @param {Array} connections - Array of { source_id, target_id }
 * @returns {Map} - Adjacency list map
 */
export function buildGraph(connections) {
  const graph = new Map();
  
  for (const conn of connections) {
    // Add source -> target
    if (!graph.has(conn.source_id)) {
      graph.set(conn.source_id, new Set());
    }
    graph.get(conn.source_id).add(conn.target_id);
    
    // Add target -> source (bidirectional)
    if (!graph.has(conn.target_id)) {
      graph.set(conn.target_id, new Set());
    }
    graph.get(conn.target_id).add(conn.source_id);
  }
  
  return graph;
}

/**
 * Find shortest path between two nodes using BFS
 * 
 * @param {Map} graph - Adjacency list map
 * @param {string} startId - Starting node ID
 * @param {string} endId - Target node ID
 * @param {number} maxDepth - Maximum path length (default: 6 for six degrees)
 * @returns {Array|null} - Path array or null if no path
 */
export function findPath(graph, startId, endId, maxDepth = 6) {
  if (startId === endId) return [startId];
  if (!graph.has(startId)) return null;
  
  const queue = [[startId, [startId]]];
  const visited = new Set([startId]);
  
  while (queue.length > 0) {
    const [current, path] = queue.shift();
    
    // Check depth limit
    if (path.length > maxDepth) continue;
    
    const neighbors = graph.get(current);
    if (!neighbors) continue;
    
    for (const neighbor of neighbors) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }
      
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  
  return null; // No path found within depth limit
}

/**
 * Find all paths between two nodes (up to a limit)
 * 
 * @param {Map} graph - Adjacency list map
 * @param {string} startId - Starting node ID
 * @param {string} endId - Target node ID
 * @param {number} maxPaths - Maximum number of paths to find
 * @param {number} maxDepth - Maximum path length
 * @returns {Array} - Array of paths
 */
export function findAllPaths(graph, startId, endId, maxPaths = 5, maxDepth = 6) {
  const paths = [];
  
  function dfs(current, path, visited) {
    if (paths.length >= maxPaths) return;
    if (path.length > maxDepth) return;
    
    if (current === endId) {
      paths.push([...path]);
      return;
    }
    
    const neighbors = graph.get(current);
    if (!neighbors) return;
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        path.push(neighbor);
        dfs(neighbor, path, visited);
        path.pop();
        visited.delete(neighbor);
      }
    }
  }
  
  const visited = new Set([startId]);
  dfs(startId, [startId], visited);
  
  // Sort by path length (shortest first)
  return paths.sort((a, b) => a.length - b.length);
}

/**
 * Load connections for a user and build graph
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Map>} - Adjacency list map
 */
export async function loadUserGraph(userId) {
  try {
    // Load user's direct connections
    const { data: connections, error } = await supabase
      .from('connections')
      .select('source_id, target_id, connection_type, strength')
      .or(`source_id.eq.${userId},target_id.eq.${userId}`);
    
    if (error) throw error;
    
    return buildGraph(connections || []);
  } catch (err) {
    console.error('[ConnectionGraph] Failed to load graph:', err);
    return new Map();
  }
}

/**
 * Load extended network graph (2-3 degrees out)
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Map>} - Extended adjacency list map
 */
export async function loadExtendedGraph(userId) {
  try {
    // First, get user's direct connections
    const { data: directConnections, error: directError } = await supabase
      .from('connections')
      .select('source_id, target_id')
      .or(`source_id.eq.${userId},target_id.eq.${userId}`);
    
    if (directError) throw directError;
    
    // Get IDs of direct connections
    const directIds = new Set();
    directConnections?.forEach(conn => {
      directIds.add(conn.source_id);
      directIds.add(conn.target_id);
    });
    directIds.delete(userId);
    
    // Load connections for direct connections (2nd degree)
    const directArray = Array.from(directIds);
    if (directArray.length === 0) {
      return buildGraph(directConnections || []);
    }
    
    const { data: secondDegree, error: secondError } = await supabase
      .from('connections')
      .select('source_id, target_id')
      .or(directArray.map(id => `source_id.eq.${id},target_id.eq.${id}`).join(','));
    
    if (secondError) throw secondError;
    
    // Combine all connections
    const allConnections = [...(directConnections || []), ...(secondDegree || [])];
    
    return buildGraph(allConnections);
  } catch (err) {
    console.error('[ConnectionGraph] Failed to load extended graph:', err);
    return new Map();
  }
}

/**
 * Find path to a target person, discovering intermediaries via Exa if needed
 * 
 * @param {string} userId - The user's ID
 * @param {object} target - Target person { name, linkedinUrl, company, etc. }
 * @returns {Promise<object>} - { path, discovered, targetContact }
 */
export async function findPathToTarget(userId, target) {
  try {
    // First, check if target is already in network
    const { data: existingContact, error: existingError } = await supabase
      .from('imported_contacts')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', `%${target.name}%`)
      .limit(1)
      .single();
    
    if (!existingError && existingContact) {
      // Target is in network, find path
      const graph = await loadExtendedGraph(userId);
      const path = findPath(graph, userId, existingContact.id);
      
      if (path) {
        return {
          path,
          discovered: false,
          targetContact: existingContact,
          degrees: path.length - 1,
        };
      }
    }
    
    // Target not in network or no direct path
    // Would use Exa to discover intermediaries here
    // For now, return no path
    return {
      path: null,
      discovered: false,
      targetContact: null,
      degrees: null,
      message: 'Target not found in your network. Try adding mutual connections.',
    };
  } catch (err) {
    console.error('[ConnectionGraph] Failed to find path:', err);
    return {
      path: null,
      error: err.message,
    };
  }
}

/**
 * Get connection strength between two nodes
 * 
 * @param {string} nodeA - First node ID
 * @param {string} nodeB - Second node ID
 * @returns {Promise<number>} - Strength (0-1) or 0 if no connection
 */
export async function getConnectionStrength(nodeA, nodeB) {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('strength')
      .or(`and(source_id.eq.${nodeA},target_id.eq.${nodeB}),and(source_id.eq.${nodeB},target_id.eq.${nodeA})`)
      .single();
    
    if (error) return 0;
    return (data?.strength || 1) / 10; // Normalize to 0-1
  } catch {
    return 0;
  }
}

/**
 * Calculate network statistics
 * 
 * @param {Map} graph - Adjacency list map
 * @returns {object} - Network stats
 */
export function calculateNetworkStats(graph) {
  const nodeCount = graph.size;
  let edgeCount = 0;
  let maxDegree = 0;
  let totalDegree = 0;
  
  for (const [_, neighbors] of graph) {
    const degree = neighbors.size;
    edgeCount += degree;
    totalDegree += degree;
    if (degree > maxDegree) maxDegree = degree;
  }
  
  edgeCount /= 2; // Undirected graph counts each edge twice
  const avgDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;
  
  return {
    nodeCount,
    edgeCount,
    maxDegree,
    avgDegree: Math.round(avgDegree * 10) / 10,
    density: nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0,
  };
}

export default {
  buildGraph,
  findPath,
  findAllPaths,
  loadUserGraph,
  loadExtendedGraph,
  findPathToTarget,
  getConnectionStrength,
  calculateNetworkStats,
};
