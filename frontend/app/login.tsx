import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ui } from '@/src/components/campus';
import { IMS_URL } from '@/src/domain/portal';
import { useIMSSession } from '@/src/ims-session';
export default function LoginScreen() {
  const state = useIMSSession(), inset = useSafeAreaInsets(), router = useRouter();
  return <View testID="login-root" style={{ flex: 1, backgroundColor: '#0F1115', paddingTop: inset.top + 16, paddingBottom: inset.bottom + 12, paddingHorizontal: 20 }}>
    <View style={[ui.row, { justifyContent: 'space-between' }]}><View><Text style={ui.h2}>NSUT Hub</Text><Text style={ui.small}>Student sign in</Text></View>{state.session ? <Button label="Back" secondary onPress={() => router.replace('/(tabs)')}/> : null}</View>
    <Text style={[ui.muted, { marginTop: 10 }]}>Your IMS roll number, password and CAPTCHA.</Text>
    <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
      {Platform.OS === 'web' ? <><Text style={ui.h2}>Sign in on Android</Text><Text style={ui.text}>Install NSUT Hub to sign in and load your reports. IMS does not support connecting this browser preview to your account.</Text></> : null}
    </View>
    <View style={{ height: 96, gap: 8 }}>
      {Platform.OS !== 'web' && state.phase === 'loading' ? <View style={ui.row}><ActivityIndicator color="#FF9298"/><Text style={ui.small}>Opening IMS…</Text></View> : <Text accessibilityRole={state.phase === 'failed' ? 'alert' : 'text'} numberOfLines={2} style={ui.small}>{Platform.OS === 'web' ? 'Browser sign-in cannot connect this preview to IMS.' : state.message || 'Reports load automatically after sign in. Your password stays with IMS.'}</Text>}
      <View style={ui.row}>{Platform.OS !== 'web' ? <Button label="Retry" secondary onPress={state.retry}/> : null}<Button label="Open official IMS" secondary onPress={() => { Linking.openURL(IMS_URL).catch(() => {}); }}/></View>
    </View>
  </View>;
}
