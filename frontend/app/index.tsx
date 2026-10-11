import { Redirect, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Loading, Message, ui } from "@/src/components/campus";
import { useAcademic } from "@/src/use-academic";

export default function Welcome() {
  const { data, loading, error } = useAcademic(), router = useRouter();
  const insets = useSafeAreaInsets(), { width } = useWindowDimensions();
  if (loading) return <View style={styles.loading}><Loading/></View>;
  if (data.attendance || data.timetable) return <Redirect href="/(tabs)"/>;
  const wide = width >= 800;
  return <ScrollView testID="welcome-root" style={styles.root} contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
    <View style={styles.container}>
      <View style={styles.brand}><Image source={require('../assets/images/icon.png')} style={styles.logo}/><View><Text style={styles.brandName}>discover spark</Text><Text style={styles.overline}>MADE FOR NSUT</Text></View></View>
      <View style={[styles.main, wide && { flexDirection: 'row', alignItems: 'center', gap: 80 }]}>
        <View style={{ flex: wide ? 1 : undefined, gap: 22 }}>
          <View style={styles.tag}><View style={styles.dot}/><Text style={styles.tagText}>A little more campus. A little less chaos.</Text></View>
          <Text accessibilityRole="header" style={[styles.title, wide && { fontSize: 52, lineHeight: 59 }]}>Your campus.{wide ? "\nYour day." : ""}{"\n"}<Text style={{ color: '#78DCC8' }}>All together.</Text></Text>
          <Text style={styles.description}>From your first lecture to your last attendance check. Make room for what matters.</Text>
          {wide ? <View style={styles.features}>
            <Feature icon="check-circle" title="Know where you stand" detail="Attendance & your personal targets"/>
            <Feature icon="calendar" title="Stay one class ahead" detail="Your timetable, ready when you are"/>
            <Feature icon="map-pin" title="Find your corner" detail="Room schedules & campus notices"/>
          </View> : null}
        </View>
        <View style={[styles.signin, wide && { flex: 0.8 }]}>
          {wide ? <View style={styles.signinIcon}><Feather name="arrow-up-right" size={25} color="#78DCC8"/></View> : null}
          <Text style={ui.h2}>Let’s get you settled.</Text>
          <Text style={ui.text}>Sign in with your IMS account to bring your academic day here.</Text>
          <Button label="Continue with IMS" icon="arrow-right" onPress={() => router.push('/login')} testID="welcome-sign-in"/>
          <View style={styles.privacy}><Feather name="lock" size={14} color="#B3B8C7"/><Text style={[ui.small, { flex: 1 }]}>Your password stays with IMS.</Text></View>
          <View style={ui.divider}/>
          <Button label="Explore the app first" secondary onPress={() => router.replace('/(tabs)')}/>
          {error ? <Message>{error}</Message> : null}
        </View>
      </View>
      <Text style={styles.footer}>NSUT Delhi · Independent student companion</Text>
    </View>
  </ScrollView>;
}
function Feature({ icon, title, detail }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; detail: string }) {
  return <View style={styles.feature}><View style={styles.featureIcon}><Feather name={icon} size={19} color="#78DCC8"/></View><View style={{ flex: 1 }}><Text style={styles.featureTitle}>{title}</Text><Text style={ui.small}>{detail}</Text></View></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F1115' }, loading: { flex: 1, backgroundColor: '#0F1115', justifyContent: 'center', padding: 24 },
  container: { flex: 1, width: '100%', maxWidth: 1080, paddingHorizontal: 24, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, logo: { width: 43, height: 43, borderRadius: 12 },
  brandName: { fontSize: 18, fontWeight: '700', color: '#F3F4F6', letterSpacing: -0.6 }, overline: { fontSize: 9, letterSpacing: 2.5, color: '#B3B8C7', marginTop: 5 },
  main: { flex: 1, justifyContent: 'center', paddingVertical: 28, gap: 24 }, tag: { flexDirection: 'row', gap: 8, alignItems: 'center' }, dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#78DCC8' }, tagText: { color: '#B3B8C7', fontSize: 11, flexShrink: 1 },
  title: { color: '#F3F4F6', fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -1.7 }, description: { color: '#B3B8C7', fontSize: 15, lineHeight: 24, maxWidth: 390 },
  features: { gap: 17 }, feature: { flexDirection: 'row', alignItems: 'center', gap: 13 }, featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172529' }, featureTitle: { color: '#F3F4F6', fontSize: 14, fontWeight: '600', marginBottom: 3 },
  signin: { borderRadius: 22, backgroundColor: '#1A1D24', padding: 24, borderWidth: 1, borderColor: '#343C44', gap: 16 }, signinIcon: { width: 42, height: 42, backgroundColor: '#233435', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8 }, footer: { textAlign: 'center', fontSize: 11, color: '#B3B8C7' },
});
