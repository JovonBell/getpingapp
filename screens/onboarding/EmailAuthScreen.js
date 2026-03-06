import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithMagicLink,
} from '../../utils/storage/supabaseStorage';

export default function EmailAuthScreen({ navigation }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = async () => {
    if (!email.trim()) { Alert.alert('Missing Email', 'Please enter your email address.'); return; }
    if (!validateEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    if (!password) { Alert.alert('Missing Password', 'Please enter your password.'); return; }

    setLoading(true);
    try {
      const res = await signInWithEmail(email.trim().toLowerCase(), password);
      if (!res.success) Alert.alert('Sign In Failed', res.error || 'Please check your credentials.');
    } catch (e) {
      Alert.alert('Sign In Failed', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim()) { Alert.alert('Missing Email', 'Please enter your email address.'); return; }
    if (!validateEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }
    if (!password) { Alert.alert('Missing Password', 'Please create a password.'); return; }
    if (password.length < 6) { Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { Alert.alert('Password Mismatch', 'Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await signUpWithEmail(email.trim().toLowerCase(), password);
      if (!res.success) {
        Alert.alert('Sign Up Failed', res.error || 'Please try again.');
      } else {
        Alert.alert('Check Your Email', 'We sent you a confirmation link. Please check your inbox to verify your account.', [
          { text: 'OK', onPress: () => setMode('signin') },
        ]);
      }
    } catch (e) {
      Alert.alert('Sign Up Failed', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) { Alert.alert('Missing Email', 'Please enter your email address.'); return; }
    if (!validateEmail(email)) { Alert.alert('Invalid Email', 'Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      const res = await signInWithMagicLink(email.trim().toLowerCase());
      if (!res.success) {
        Alert.alert('Failed to Send', res.error || 'Please try again.');
      } else {
        navigation.navigate('MagicLinkSent', { email: email.trim().toLowerCase() });
      }
    } catch (e) {
      Alert.alert('Failed to Send', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (icon, placeholder, value, onChangeText, options = {}) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.25)" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        value={value}
        onChangeText={onChangeText}
        keyboardType={options.keyboardType}
        autoCapitalize={options.autoCapitalize || 'none'}
        autoComplete={options.autoComplete}
        secureTextEntry={options.secureTextEntry}
      />
      {options.rightIcon && (
        <TouchableOpacity onPress={options.onRightPress}>
          <Ionicons name={options.rightIcon} size={18} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSignIn = () => (
    <>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      {renderInput('mail-outline', 'Email', email, setEmail, { keyboardType: 'email-address', autoComplete: 'email' })}
      {renderInput('lock-closed-outline', 'Password', password, setPassword, {
        secureTextEntry: !showPassword,
        rightIcon: showPassword ? 'eye-off-outline' : 'eye-outline',
        onRightPress: () => setShowPassword(!showPassword),
      })}
      <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={['#4FFFB0', '#00D68F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonGradient}>
          {loading ? <ActivityIndicator color="#0A0A0F" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode('magiclink')}>
        <Text style={styles.linkText}>Forgot password? Use magic link</Text>
      </TouchableOpacity>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity onPress={() => setMode('signup')}>
        <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Sign up</Text></Text>
      </TouchableOpacity>
    </>
  );

  const renderSignUp = () => (
    <>
      <Text style={styles.subtitle}>Create your account</Text>
      {renderInput('mail-outline', 'Email', email, setEmail, { keyboardType: 'email-address', autoComplete: 'email' })}
      {renderInput('lock-closed-outline', 'Password', password, setPassword, {
        secureTextEntry: !showPassword,
        rightIcon: showPassword ? 'eye-off-outline' : 'eye-outline',
        onRightPress: () => setShowPassword(!showPassword),
      })}
      {renderInput('lock-closed-outline', 'Confirm Password', confirmPassword, setConfirmPassword, { secureTextEntry: !showPassword })}
      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={['#4FFFB0', '#00D68F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonGradient}>
          {loading ? <ActivityIndicator color="#0A0A0F" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity onPress={() => setMode('signin')}>
        <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Sign in</Text></Text>
      </TouchableOpacity>
    </>
  );

  const renderMagicLink = () => (
    <>
      <Text style={styles.subtitle}>Sign in with magic link</Text>
      <Text style={styles.description}>
        Enter your email and we'll send you a link to sign in instantly - no password needed.
      </Text>
      {renderInput('mail-outline', 'Email', email, setEmail, { keyboardType: 'email-address', autoComplete: 'email' })}
      <TouchableOpacity style={styles.primaryButton} onPress={handleMagicLink} disabled={loading} activeOpacity={0.85}>
        <LinearGradient colors={['#4FFFB0', '#00D68F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryButtonGradient}>
          {loading ? <ActivityIndicator color="#0A0A0F" /> : <Text style={styles.primaryButtonText}>Send Magic Link</Text>}
        </LinearGradient>
      </TouchableOpacity>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <TouchableOpacity onPress={() => setMode('signin')}>
        <Text style={styles.switchText}>Back to <Text style={styles.switchLink}>password sign in</Text></Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>ping!</Text>
            {mode === 'signin' && renderSignIn()}
            {mode === 'signup' && renderSignUp()}
            {mode === 'magiclink' && renderMagicLink()}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 28,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 15,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
  },
  linkText: {
    color: '#4FFFB0',
    fontSize: 14,
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  switchText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  switchLink: {
    fontWeight: '600',
    color: '#4FFFB0',
  },
});
