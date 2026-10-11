import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { Badge, Button, Card, Page, ui } from "@/src/components/campus";
export default function Results() {
  const router = useRouter();
  return <Page title="Results" subtitle="A clearer picture of your academic journey." testID="results-root" action={<Button label="Back to Today" secondary onPress={() => router.replace('/(tabs)')}/> }>
    <Card style={{ padding: 30, minHeight: 340, justifyContent: "center", borderTopWidth: 3, borderTopColor: '#E98A91' }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#34252D', alignItems: 'center', justifyContent: 'center' }}><Feather name="award" size={30} color="#FFB1B7"/></View>
      <Badge tone="info">COMING SOON</Badge><Text style={[ui.title, { marginBottom: 0, maxWidth: 550 }]}>Your progress deserves a better view.</Text>
      <Text style={[ui.text, { maxWidth: 590 }]}>We’re building a thoughtful home for semester results. This feature is under development; marks, grades, and CGPA are not available here yet.</Text>
      <Text style={ui.muted}>For now, keep your academic day in focus with attendance and your timetable.</Text><Button label="Explore my timetable" icon="calendar" onPress={() => router.replace('/(tabs)/timetable')}/>
    </Card>
  </Page>;
}
