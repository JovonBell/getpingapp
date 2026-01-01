/**
 * Custom Expo config plugin to force iOS deployment target
 *
 * This plugin modifies BOTH:
 * 1. Xcode project build settings
 * 2. Podfile post_install hook (for CocoaPods)
 *
 * This ensures the deployment target is set correctly everywhere.
 */
const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withIosDeploymentTarget = (config, { deploymentTarget = '17.0' } = {}) => {
  // Step 1: Modify Xcode project build settings
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== 'undefined') {
        configurations[key].buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      }
    }

    console.log(`[withIosDeploymentTarget] Set Xcode project deployment target to ${deploymentTarget}`);
    return config;
  });

  // Step 2: Modify Podfile to set deployment target for all pods
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        console.log('[withIosDeploymentTarget] Podfile not found, skipping Podfile modification');
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      // The code to inject into post_install
      const deploymentTargetCode = `
  # Force iOS deployment target for all pods
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'
    end
  end`;

      // Check if we already added our code
      if (podfileContent.includes(`config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`)) {
        console.log('[withIosDeploymentTarget] Podfile already has deployment target set');
        return config;
      }

      // Check if there's an existing post_install block
      if (podfileContent.includes('post_install do |installer|')) {
        // Insert our code right after the post_install opening
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `post_install do |installer|${deploymentTargetCode}`
        );
      } else {
        // Add a new post_install block at the end
        podfileContent += `

post_install do |installer|${deploymentTargetCode}
end
`;
      }

      fs.writeFileSync(podfilePath, podfileContent);
      console.log(`[withIosDeploymentTarget] Updated Podfile with deployment target ${deploymentTarget}`);

      return config;
    },
  ]);

  return config;
};

module.exports = withIosDeploymentTarget;
