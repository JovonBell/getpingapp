/**
 * Custom Expo config plugin to fix NFC entitlements for SDK 26+
 *
 * The react-native-nfc-manager plugin automatically adds NDEF to entitlements,
 * but SDK 26 (Xcode 16) doesn't allow NDEF in entitlements anymore.
 * This plugin removes NDEF and keeps only TAG.
 *
 * Note: NFC reading/writing still works without NDEF in entitlements (known workaround).
 */
const { withEntitlementsPlist } = require('@expo/config-plugins');

const withNfcEntitlementsFix = (config) => {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    // Check if NFC entitlements exist
    const nfcKey = 'com.apple.developer.nfc.readersession.formats';
    if (entitlements[nfcKey]) {
      // Remove NDEF, keep only TAG
      const formats = entitlements[nfcKey];
      if (Array.isArray(formats)) {
        entitlements[nfcKey] = formats.filter(f => f !== 'NDEF');
        // Ensure TAG is present
        if (!entitlements[nfcKey].includes('TAG')) {
          entitlements[nfcKey].push('TAG');
        }
      }
      console.log('[withNfcEntitlementsFix] Fixed NFC entitlements:', entitlements[nfcKey]);
    }

    return config;
  });
};

module.exports = withNfcEntitlementsFix;
