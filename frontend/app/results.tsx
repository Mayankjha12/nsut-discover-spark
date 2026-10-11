import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { Badge, Button, Card, Page, ui } from "@/src/components/campus";
export default function Results() {
  const router = useRouter();
  return <Page title="Results" testID="results-root" action={<Button label="Back to Today" secondary onPress={() => router.replace('/(tabs)')}/> }>
    <Card style={{ padding: 24, minHeight: 230, justifyContent: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#34252D', alignItems: 'center', justifyContent: 'center' }}><Feather name="award" size={23} color="#E98A91"/></View>
      <Badge tone="info">COMING SOON</Badge>
      <Text style={ui.h2}>Semester results</Text>
      <Text style={ui.muted}>This section is still being built. Marks, grades and CGPA aren’t available in NSUT Hub yet.</Text>
    </Card>
  </Page>;
}
