import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Loading, Message, ui } from "@/src/components/campus";
import { useAcademic } from "@/src/use-academic";

export default function Welcome() {
  const { data, loading, error } = useAcademic(), router = useRouter();
  const insets = useSafeAreaInsets();
  if (loading) return <View style={styles.loading}><Loading/></View>;
  if (data.attendance || data.timetable) return <Redirect href="/(tabs)"/>;
  return <ScrollView testID="welcome-root" style={styles.root} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
    <View style={styles.container}>
      <View style={styles.brand}><Image source={require('../assets/images/icon.png')} style={styles.logo}/><View><Text accessibilityRole="header" style={styles.brandName}>NSUT Hub</Text><Text style={ui.small}>Attendance · Timetable · Campus</Text></View></View>
      <View style={styles.signin}>
        <Text accessibilityRole="header" style={styles.title}>Student login</Text>
        <Text style={ui.muted}>Use your IMS account to save your attendance and timetable on this phone.</Text>
        <View style={styles.instructions}><Feather name="user" size={18} color="#E98A91"/><Text style={[ui.text, { flex: 1 }]}>Have your roll number and password ready.</Text></View>
        <Button label="Sign in with IMS" icon="arrow-right" onPress={() => router.push('/login')} testID="welcome-sign-in"/>
        <Text style={ui.small}>You’ll enter your details and CAPTCHA on the official IMS page. Your password isn’t saved by NSUT Hub.</Text>
        <View style={ui.divider}/>
        <Button label="Continue without signing in" secondary onPress={() => router.replace('/(tabs)')}/>
        {error ? <Message>{error}</Message> : null}
      </View>
      <View style={styles.links}>
        <Text style={styles.sectionLabel}>CAMPUS LINKS</Text>
        <Shortcut icon="bell" title="Notices" detail="Campus announcements" onPress={() => router.push('/news')}/>
        <Shortcut icon="map-pin" title="Rooms" detail="Check published room schedules" onPress={() => router.push('/(tabs)/rooms')}/>
        <Shortcut icon="award" title="Results" detail="Coming soon" onPress={() => router.push('/results')}/>
      </View>
      <Text style={styles.footer}>Student project · Not an official NSUT app</Text>
    </View>
  </ScrollView>;
}
function Shortcut({ icon, title, detail, onPress }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; detail: string; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${detail}`} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [styles.shortcut, pressed && { backgroundColor: '#252932' }, focused && { borderColor: '#F3F4F6' }]}>
    <Feather name={icon} size={20} color="#B3B8C7"/><View style={{ flex: 1 }}><Text style={styles.linkTitle}>{title}</Text><Text style={ui.small}>{detail}</Text></View><Feather name="chevron-right" size={17} color="#9CA3AF"/>
  </Pressable>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' }, loading: { flex: 1, backgroundColor: '#0F1115', justifyContent: 'center', padding: 24 },
  container: { flex: 1, width: '100%', maxWidth: 490, paddingHorizontal: 22, paddingTop: 8, alignSelf: 'center', gap: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14 }, logo: { width: 54, height: 54, borderRadius: 14 },
  brandName: { fontSize: 26, fontWeight: '700', color: '#F3F4F6', letterSpacing: -0.5, marginBottom: 4 },
  title: { color: '#F3F4F6', fontSize: 21, fontWeight: '600' },
  signin: { borderRadius: 16, backgroundColor: '#1A1D24', padding: 20, borderWidth: 1, borderColor: '#2A2D35', gap: 16 },
  instructions: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 4 },
  links: { gap: 4 }, sectionLabel: { color: '#B3B8C7', fontSize: 10, fontWeight: '600', letterSpacing: 1.2, marginBottom: 5 },
  shortcut: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 10, paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  linkTitle: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', marginBottom: 2 }, footer: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 'auto', paddingTop: 12 },
});
