# Ping App: People Search Integration Guide

> A comprehensive guide for integrating state-of-the-art people search into an iOS/Expo app to power concentric circles visualization and six degrees of connection discovery.

---

## 📣 Context: Where These Recommendations Come From

This guide synthesizes insights from several real-world implementations shared on X/Twitter:

### Tweet 1: Jeffrey Wang (@jeffzwang) - Exa Co-founder
**Who**: Co-founder of Exa AI (prev SPC, Plaid, Harvard). Built Exa with Will Bryk after meeting at Harvard's freshman orientation 10 years ago.

**What he announced (Dec 17, 2025)**: Exa's new state-of-the-art People Search that indexes 1B+ profiles with 63% accuracy (vs Brave 30%, Parallel 27%).

**Key insight**: *"If you want a complex perfect list, you should probably still use Websets (verifies results with LLMs). But now the regular Exa API 'just works' for a huge number of popular use cases."*

**Relevance to Ping**: This is the announcement of the exact feature your friend needs - semantic people search that "just works" for finding and connecting people.

---

### Tweet 2: Yazin (@yazinsai) - Developer/Builder
**Who**: Developer who tested multiple LLM-powered search APIs for a specific use case.

**What he built**: A system that needs to find LinkedIn URLs for people given just their name and description.

**His comparison test**:
- ❌ Gemini - failed
- ❌ Perplexity - failed  
- ❌ Tavily - failed
- ❌ Exa - failed (at time of test, Nov 2025 - *before* the Dec 17 people search update)
- ❌ Jina - failed
- ⚠️ GPT-search - worked but "SOOOO expensive"
- ✅ **Linkup** - "nailed it" at ~$0.005/request

**Key insight**: For finding specific LinkedIn profile URLs from name + description, Linkup excelled where others failed. However, Exa's new Dec 17 update may change this equation.

**Relevance to Ping**: Shows that Linkup is excellent for LinkedIn URL resolution - useful for enriching profiles after Exa discovers them, or as a fallback.

---

### Tweet 3: Arthur (@arthurliebhardt) - Podpally Builder
**Who**: Developer who built Podpally - an AI podcast research assistant.

**What he built**: A tool that helps podcasters prepare for interviews by:
- **Topic Research with Exa**: Enhancing LLM prompts with relevant data
- **Guest Research via LinkedIn**: Integrating LinkedIn data with LLM prompts
- Analyzing guests' LinkedIn profiles and recent posts for interview prep

**Implementation details**: 
- Uses Exa to semantically search for topic-relevant content
- Pulls LinkedIn data to enrich podcast guest profiles
- Generates tailored interview questions based on research
- Built the core functionality in "just one week" while "deep into developer mode"

**Key insight**: Exa + LinkedIn data is a powerful combo for building comprehensive people profiles.

**Relevance to Ping**: This is a direct parallel to what Ping needs - enriching user profiles with comprehensive data from multiple sources to enable better connections.

---

### Tweet 4: Tech Friend AJ (@techfrenAJ) - AI Developer Advocate
**Who**: Tech content creator focused on AI tools for developers.

**What he shared**: Configuration for free Exa MCP access with all tools enabled.

**Key pro tip**: *"Add the tools parameter to unlock deep researcher, LinkedIn search, and web crawler. All free, no API key."*

**The config he shared**:
```json
{
  "mcpServers": {
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp?tools=web_search_exa,get_code_context_exa,crawling_exa,company_research_exa,linkedin_search_exa,deep_researcher_start,deep_researcher_check",
      "headers": {}
    }
  }
}
```

**Key insight**: Exa built their own neural search index from scratch ("not a Google wrapper") and the hosted MCP is free to use.

**Relevance to Ping**: Zero-cost way to prototype and test people search before committing to paid API usage.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Tools: Exa vs Linkup](#the-tools-exa-vs-linkup)
3. [Integration Approaches](#integration-approaches)
   - [Approach 1: MCP (Model Context Protocol)](#approach-1-mcp-model-context-protocol)
   - [Approach 2: Direct SDK Integration](#approach-2-direct-sdk-integration)
   - [Approach 3: REST API Direct Calls](#approach-3-rest-api-direct-calls)
4. [Exa People Search Deep Dive](#exa-people-search-deep-dive)
5. [Linkup Integration Details](#linkup-integration-details)
6. [Recommended Architecture for Ping](#recommended-architecture-for-ping)
7. [Code Examples](#code-examples)
8. [Pricing Comparison](#pricing-comparison)
9. [Resources & Links](#resources--links)

---

## 🆓 FREE TIER ALERT

**Big news**: Exa's hosted MCP endpoint works **without an API key** for basic usage!

```json
{
  "mcpServers": {
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp?tools=web_search_exa,linkedin_search_exa,deep_researcher_start,deep_researcher_check"
    }
  }
}
```

- **No API key required** for the hosted MCP at `https://mcp.exa.ai/mcp`
- Exa partnered with **Smithery** to offer free MCP access: https://smithery.ai/server/exa
- `exa-code` (code context search) is **free for public** on Smithery
- For production/heavy usage, get an API key at https://dashboard.exa.ai (free tier with starting credits available)

---

## Executive Summary

**Goal**: Enable Ping to collect detailed information on people and allow users to discover connections through concentric circles visualization (law of 6 connections).

**Key Insight from Recent Benchmarks (Dec 2025)**:
- **Exa People Search** just launched with 63% accuracy (vs Brave 30%, Parallel 27%)
- Indexes **1 billion+ people** using hybrid retrieval with fine-tuned embeddings
- Specifically optimized for LinkedIn profiles and professional data
- **Linkup** excels at factual accuracy (#1 on SimpleQA benchmark) and costs ~$0.005/request

**Recommendation**: Use **Exa for people discovery** (finding profiles, LinkedIn data, professional info) and optionally **Linkup for enrichment** (verifying facts, getting current news about people).

---

## The Tools: Exa vs Linkup

### Exa AI

| Feature | Details |
|---------|---------|
| **Best For** | People search, LinkedIn profiles, professional discovery |
| **People Index** | 1B+ profiles with 50M+ updates/week |
| **Accuracy** | 63% on people search benchmark |
| **Special Tools** | `linkedin_search`, `company_research`, `deep_researcher` |
| **Category Filter** | `category: "people"` for optimized results |
| **Pricing** | Pay-per-search, varies by search type |

### Linkup

| Feature | Details |
|---------|---------|
| **Best For** | Factual verification, current information, deep research |
| **Accuracy** | #1 on OpenAI SimpleQA benchmark |
| **Speed** | ~$0.005/request, extremely fast |
| **Modes** | `standard` (fast) and `deep` (comprehensive) |
| **Pricing** | ~$0.005/request |

---

## Integration Approaches

### Approach 1: MCP (Model Context Protocol)

**Best for**: AI-powered features, agent workflows, Claude integration

MCP provides a standardized way to connect AI models to data sources. Both Exa and Linkup offer hosted MCP servers.

#### Exa MCP Setup

**🆓 FREE: Remote MCP (No API Key Needed!)**

The hosted MCP works without an API key for basic usage:

```json
{
  "mcpServers": {
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp?tools=web_search_exa,linkedin_search_exa,company_research_exa"
    }
  }
}
```

**With API Key (for heavy usage/production)**

```json
{
  "mcpServers": {
    "exa": {
      "type": "http",
      "url": "https://mcp.exa.ai/mcp?tools=web_search_exa,linkedin_search_exa,company_research_exa&exaApiKey=YOUR_EXA_KEY"
    }
  }
}
```

**Available MCP Tools**:
- `web_search_exa` - General web search (enabled by default)
- `linkedin_search_exa` - **KEY FOR PING** - Search LinkedIn for people/companies
- `company_research_exa` - Deep company research with website crawling
- `deep_researcher_start` / `deep_researcher_check` - AI researcher for complex questions
- `get_code_context_exa` - Code documentation search (enabled by default)

**Enable All Tools URL**:
```
https://mcp.exa.ai/mcp?tools=web_search_exa,get_code_context_exa,crawling_exa,company_research_exa,linkedin_search_exa,deep_researcher_start,deep_researcher_check
```

#### Linkup MCP Setup

**Remote MCP Endpoint**:
```json
{
  "mcpServers": {
    "linkup": {
      "type": "http",
      "url": "https://mcp.linkup.so/mcp?apiKey=YOUR_LINKUP_API_KEY"
    }
  }
}
```

**Available MCP Tools**:
- `linkup-search` - Real-time web search with natural language queries
- `linkup-fetch` - Extract content from any webpage URL

**NPX Local Install (Alternative)**:
```json
{
  "mcpServers": {
    "linkup": {
      "command": "npx",
      "args": ["-y", "linkup-mcp-server", "apiKey=YOUR_LINKUP_API_KEY"]
    }
  }
}
```

---

### Approach 2: Direct SDK Integration

**Best for**: Production apps, React Native/Expo, full control

#### Exa JavaScript SDK

```bash
npm install exa-js
```

```typescript
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

// People search with category filter
const peopleResults = await exa.search("VP of Engineering at fintech startups in SF", {
  type: "auto",
  category: "people",  // Critical for people search optimization
  numResults: 10,
});

// Search with content extraction
const detailedResults = await exa.searchAndContents(
  "John Smith product manager at Stripe",
  {
    type: "auto",
    category: "people",
    text: { maxCharacters: 3000 },
    highlights: true,
  }
);

// Find similar profiles to a LinkedIn URL
const similarProfiles = await exa.findSimilarAndContents(
  "https://linkedin.com/in/example-profile",
  { 
    text: true,
    excludeSourceDomain: false  // Include more LinkedIn results
  }
);

// Deep research on a person
const { id: taskId } = await exa.research.createTask({
  instructions: "Find all public information about Jane Doe, CEO of TechCorp",
  output: { 
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        currentRole: { type: "string" },
        company: { type: "string" },
        linkedinUrl: { type: "string" },
        education: { type: "array", items: { type: "string" } },
        previousRoles: { type: "array", items: { type: "string" } },
      }
    }
  }
});
const researchResult = await exa.research.pollTask(taskId);
```

#### Linkup TypeScript/JavaScript

```bash
npm install linkup-sdk  # or use fetch directly
```

```typescript
// Direct API call (works great in React Native)
async function searchWithLinkup(query: string, depth: "standard" | "deep" = "standard") {
  const response = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LINKUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      depth: depth,
      outputType: "sourcedAnswer",  // or "searchResults" for raw results
    }),
  });
  return response.json();
}

// Usage for person enrichment
const personInfo = await searchWithLinkup(
  "What is Jane Smith's current role at Google and her professional background?",
  "deep"
);
```

---

### Approach 3: REST API Direct Calls

**Best for**: Backend services, serverless functions, any language

#### Exa REST API

**Search Endpoint**:
```bash
curl -X POST 'https://api.exa.ai/search' \
  -H 'x-api-key: YOUR_EXA_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "CTO at AI startups in Boston",
    "type": "auto",
    "category": "people",
    "numResults": 10,
    "text": true
  }'
```

**Search Parameters for People**:
| Parameter | Value | Description |
|-----------|-------|-------------|
| `type` | `"auto"` | Hybrid neural/keyword search |
| `category` | `"people"` | **Optimized for LinkedIn/people profiles** |
| `numResults` | 1-100 | Number of results |
| `text` | `true` or `{maxCharacters: N}` | Include page text |
| `highlights` | `true` | Get relevant snippets |
| `includeDomains` | `["linkedin.com"]` | Filter to specific domains |

#### Linkup REST API

**Search Endpoint**:
```bash
curl -X POST 'https://api.linkup.so/v1/search' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "q": "Who is the current CEO of Anthropic and their background?",
    "depth": "deep",
    "outputType": "sourcedAnswer"
  }'
```

**Parameters**:
| Parameter | Options | Description |
|-----------|---------|-------------|
| `q` | string | Natural language query (full questions work best) |
| `depth` | `"standard"` / `"deep"` | Standard for quick facts, deep for research |
| `outputType` | `"sourcedAnswer"` / `"searchResults"` / `"structured"` | Response format |
| `maxResults` | number | Limit results count |

---

## Exa People Search Deep Dive

### What Makes Exa's People Search Special (Dec 2025 Launch)

1. **Hybrid Retrieval System**: Combines fine-tuned Exa embeddings with traditional search
2. **1B+ Profile Index**: Massive database updated 50M+ times per week
3. **63% Accuracy**: Significantly outperforms competitors (Brave: 30%, Parallel: 27%)
4. **Three Query Types Optimized**:
   - **Role-based**: "VP of Product at Figma"
   - **Skill/location discovery**: "Director of sales operations in Chicago SaaS"
   - **Specific individual lookup**: "Jane Smith at Acme Corp"

### People Search Query Examples

```typescript
// Role-based discovery
const execs = await exa.searchAndContents(
  "Chief Technology Officer at Series B fintech companies",
  { category: "people", type: "auto", numResults: 20 }
);

// Skill + Location search
const candidates = await exa.searchAndContents(
  "Machine learning engineers with experience in computer vision, Bay Area",
  { category: "people", type: "auto" }
);

// Specific person lookup
const person = await exa.searchAndContents(
  "Sarah Johnson Head of Product at Stripe",
  { category: "people", type: "auto", numResults: 5 }
);

// LinkedIn-specific search
const linkedinProfiles = await exa.search(
  "founders of AI companies in NYC",
  { 
    category: "people",
    includeDomains: ["linkedin.com"],
    numResults: 25
  }
);
```

### Using the Playground

Test queries at: https://exa.ai/search
- Set `type = "auto"`  
- Set `category = "people"`
- Experiment with query phrasing

---

## Linkup Integration Details

### When to Use Linkup for Ping

1. **Fact Verification**: Confirm details about a person are current/accurate
2. **News & Updates**: Find recent news mentions of a person
3. **Deep Background**: Research someone's history, achievements, mentions
4. **Complementary Enrichment**: After Exa finds profiles, use Linkup to verify/enrich

### Linkup Response Format

```json
{
  "answer": "Jane Smith is currently the VP of Engineering at TechCorp, having joined in 2023...",
  "sources": [
    {
      "name": "TechCorp Leadership Page",
      "url": "https://techcorp.com/about/leadership",
      "snippet": "Jane Smith leads our engineering organization..."
    },
    {
      "name": "LinkedIn",
      "url": "https://linkedin.com/in/janesmith",
      "snippet": "VP of Engineering at TechCorp | Ex-Google..."
    }
  ]
}
```

### Integration Code

```typescript
interface LinkupSource {
  name: string;
  url: string;
  snippet: string;
}

interface LinkupResponse {
  answer: string;
  sources: LinkupSource[];
}

async function enrichPersonWithLinkup(
  name: string, 
  knownInfo?: string
): Promise<LinkupResponse> {
  const query = knownInfo 
    ? `What is ${name}'s current role and recent professional activities? Known context: ${knownInfo}`
    : `Who is ${name} and what is their current professional role and background?`;

  const response = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.LINKUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      depth: "deep",
      outputType: "sourcedAnswer",
    }),
  });

  return response.json();
}
```

---

## Recommended Architecture for Ping

### For Concentric Circles & Six Degrees Features

```
┌─────────────────────────────────────────────────────────────────┐
│                         PING APP (Expo/RN)                       │
├─────────────────────────────────────────────────────────────────┤
│  User Search Input                                               │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Backend API     │ (Next.js API routes / Express / Serverless)│
│  └────────┬────────┘                                            │
│           │                                                      │
│     ┌─────┴─────┐                                               │
│     ▼           ▼                                               │
│ ┌───────┐   ┌────────┐                                          │
│ │  EXA  │   │ LINKUP │                                          │
│ └───┬───┘   └───┬────┘                                          │
│     │           │                                                │
│     ▼           ▼                                                │
│ People      Fact                                                 │
│ Discovery   Enrichment                                           │
│     │           │                                                │
│     └─────┬─────┘                                                │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │  Unified Person │                                            │
│  │  Profile Cache  │ (PostgreSQL / Supabase)                    │
│  └────────┬────────┘                                            │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Connection      │                                            │
│  │ Graph Builder   │                                            │
│  └────────┬────────┘                                            │
│           ▼                                                      │
│  Concentric Circles Visualization                               │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Service Code (TypeScript/Node)

```typescript
// services/peopleSearch.ts
import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY!);

interface PersonProfile {
  name: string;
  linkedinUrl?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  connections?: string[];
  rawData: any;
}

// Primary people discovery
export async function discoverPeople(query: string): Promise<PersonProfile[]> {
  const results = await exa.searchAndContents(query, {
    type: "auto",
    category: "people",
    numResults: 20,
    text: { maxCharacters: 2000 },
    highlights: true,
  });

  return results.results.map(result => ({
    name: extractName(result),
    linkedinUrl: result.url.includes("linkedin.com") ? result.url : undefined,
    currentRole: extractRole(result.text),
    company: extractCompany(result.text),
    location: extractLocation(result.text),
    rawData: result,
  }));
}

// Find connections between people
export async function findConnections(
  personA: string, 
  personB: string
): Promise<PersonProfile[]> {
  // Search for mutual connections, shared companies, etc.
  const query = `people connected to both ${personA} and ${personB}`;
  
  const results = await exa.searchAndContents(query, {
    type: "auto",
    category: "people",
    numResults: 50,
  });

  return processConnectionResults(results);
}

// Find similar people (for "people you may know")
export async function findSimilarPeople(linkedinUrl: string): Promise<PersonProfile[]> {
  const results = await exa.findSimilarAndContents(linkedinUrl, {
    text: true,
    numResults: 20,
  });

  return results.results.map(result => ({
    name: extractName(result),
    linkedinUrl: result.url,
    rawData: result,
  }));
}

// Enrich with Linkup for verification
export async function enrichProfile(profile: PersonProfile): Promise<PersonProfile> {
  const query = profile.linkedinUrl 
    ? `Current information about ${profile.name}, ${profile.currentRole} at ${profile.company}`
    : `Who is ${profile.name} and what is their current role?`;

  const enrichment = await fetch("https://api.linkup.so/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.LINKUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      depth: "standard",
      outputType: "sourcedAnswer",
    }),
  }).then(r => r.json());

  return {
    ...profile,
    enrichedInfo: enrichment.answer,
    sources: enrichment.sources,
  };
}

// Helper functions
function extractName(result: any): string {
  // Parse name from title or text
  const title = result.title || "";
  return title.split(" - ")[0].split(" | ")[0].trim();
}

function extractRole(text: string): string | undefined {
  // Simple extraction - enhance with regex or LLM
  const patterns = [
    /(?:CEO|CTO|VP|Director|Manager|Engineer|Head of)\s+(?:of\s+)?[\w\s]+/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

function extractCompany(text: string): string | undefined {
  // Extract company from patterns like "at Company" or "@ Company"
  const match = text.match(/(?:at|@)\s+([\w\s]+?)(?:\s*[,|•·]|$)/i);
  return match ? match[1].trim() : undefined;
}

function extractLocation(text: string): string | undefined {
  // Location extraction
  const match = text.match(/(?:based in|located in|from)\s+([\w\s,]+)/i);
  return match ? match[1].trim() : undefined;
}
```

### Expo/React Native Frontend

```typescript
// hooks/usePeopleSearch.ts
import { useState } from 'react';

interface SearchResult {
  people: PersonProfile[];
  loading: boolean;
  error: string | null;
}

export function usePeopleSearch() {
  const [state, setState] = useState<SearchResult>({
    people: [],
    loading: false,
    error: null,
  });

  const searchPeople = async (query: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE}/api/people/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const data = await response.json();
      setState({ people: data.profiles, loading: false, error: null });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: 'Search failed' }));
    }
  };

  const findConnectionPath = async (fromPerson: string, toPerson: string) => {
    // Find six degrees path between two people
    const response = await fetch(`${API_BASE}/api/people/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personA: fromPerson, personB: toPerson }),
    });
    return response.json();
  };

  return { ...state, searchPeople, findConnectionPath };
}
```

---

## Code Examples

### Complete Expo Integration Example

```typescript
// App.tsx - People discovery with concentric circles
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { usePeopleSearch } from './hooks/usePeopleSearch';

export default function PeopleDiscoveryScreen() {
  const [query, setQuery] = useState('');
  const { people, loading, searchPeople, findConnectionPath } = usePeopleSearch();
  const [selectedPerson, setSelectedPerson] = useState(null);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        placeholder="Search for people (e.g., 'AI researchers in Boston')"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => searchPeople(query)}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8, marginBottom: 16 }}
      />
      
      {loading && <Text>Searching across 1B+ profiles...</Text>}
      
      <FlatList
        data={people}
        keyExtractor={(item) => item.linkedinUrl || item.name}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => setSelectedPerson(item)}
            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ color: '#666' }}>{item.currentRole} at {item.company}</Text>
            {item.location && <Text style={{ color: '#999' }}>{item.location}</Text>}
          </TouchableOpacity>
        )}
      />
      
      {selectedPerson && (
        <ConcentricCirclesView 
          centerPerson={selectedPerson}
          onFindConnection={(target) => findConnectionPath(selectedPerson.name, target.name)}
        />
      )}
    </View>
  );
}
```

### Server-Side API Routes (Next.js Example)

```typescript
// pages/api/people/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Exa from 'exa-js';

const exa = new Exa(process.env.EXA_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;

  try {
    const results = await exa.searchAndContents(query, {
      type: "auto",
      category: "people",
      numResults: 25,
      text: { maxCharacters: 1500 },
      highlights: true,
    });

    const profiles = results.results.map(result => ({
      name: result.title?.split(' - ')[0] || 'Unknown',
      url: result.url,
      linkedinUrl: result.url.includes('linkedin.com') ? result.url : null,
      text: result.text,
      highlights: result.highlights,
      publishedDate: result.publishedDate,
    }));

    res.status(200).json({ profiles });
  } catch (error) {
    console.error('People search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}
```

---

## Pricing Comparison

### Exa Pricing (as of Dec 2025)

| Search Type | Price | Best For |
|-------------|-------|----------|
| Basic Search | ~$0.001/search | Quick lookups |
| Search + Contents | ~$0.003/search | Full profile data |
| Research Agent | ~$0.01+/task | Deep investigation |

**Get API Key**: https://dashboard.exa.ai/api-keys

### Linkup Pricing

| Tier | Price | Description |
|------|-------|-------------|
| Standard | ~$0.005/request | Fast factual search |
| Deep | ~$0.01/request | Multi-source research |
| Free Tier | Available | Limited credits to start |

**Get API Key**: https://app.linkup.so/sign-up

---

## Resources & Links

### Exa

- **🆓 Free MCP via Smithery**: https://smithery.ai/server/exa (no API key needed!)
- **Documentation**: https://docs.exa.ai/
- **MCP Setup**: https://docs.exa.ai/reference/exa-mcp
- **People Search Benchmark Blog**: https://exa.ai/blog/people-search-benchmark
- **JavaScript SDK**: https://github.com/exa-labs/exa-js
- **API Dashboard**: https://dashboard.exa.ai (free tier with credits available)
- **Playground**: https://exa.ai/search (set category to "people")
- **Discord**: https://discord.com/invite/HCShtBqbfV

### Linkup

- **Documentation**: https://docs.linkup.so/
- **MCP Integration**: https://docs.linkup.so/pages/integrations/mcp/mcp
- **GitHub MCP Server**: https://github.com/LinkupPlatform/linkup-mcp-server
- **Playground**: https://app.linkup.so/playground
- **Sign Up**: https://app.linkup.so/sign-up
- **Discord**: https://discord.com/invite/9q9mCYJa86

### MCP Protocol

- **MCP Specification**: https://modelcontextprotocol.io/
- **Anthropic MCP Docs**: https://docs.anthropic.com/en/docs/mcp

---

## Quick Start Checklist

1. [ ] **Option A (Free)**: Use hosted MCP at `https://mcp.exa.ai/mcp` - no signup needed!
2. [ ] **Option B (Production)**: Sign up for Exa API key at https://dashboard.exa.ai (free tier available)
3. [ ] Optionally sign up for Linkup API key at https://app.linkup.so (for fact enrichment)
4. [ ] Install SDK if needed: `npm install exa-js`
5. [ ] Test queries in Exa Playground with `category: "people"`
6. [ ] Set up backend API routes to proxy requests (keep keys server-side for production)
7. [ ] Implement people search in Expo app
8. [ ] Build connection graph data structure
9. [ ] Create concentric circles visualization component
10. [ ] Optional: Add MCP for AI-powered features

---

*Last updated: December 2025*
*Based on Exa People Search launch (Dec 17, 2025) and latest Linkup documentation*
