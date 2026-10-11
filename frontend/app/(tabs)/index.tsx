import { Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Loading, Message, Page, ui } from "@/src/components/campus";
import { classStatus, dayClasses, freshness, istTime, minutes, overall } from "@/src/domain/academic";
import { useAcademic, useNow } from "@/src/use-academic";
export default function Home() {
  const { data, target, loading, error } = useAcademic(), now = useNow(), router = useRouter(), { width } = useWindowDimensions();
  const today = istTime(now), schedule = dayClasses(data.timetable?.data ?? [], today.day).filter(e => !e.cancelled);
  const remaining = schedule.filter(e => minutes(e.end)! > today.minute), next = remaining[0], pct = overall(data.attendance?.data ?? []);
  const low = data.attendance?.data.filter(s => s.percent !== null && s.percent < target) ?? [];
  return <Page title={data.profile?.name ? `Hi, ${data.profile.name.split(' ')[0]}` : 'Today'} subtitle={now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long' })} testID="home-root" action={<Button label="Sync IMS" icon="refresh-cw" onPress={() => router.push('/login')}/> }>
    {error ? <Message>{error}</Message> : null}{loading ? <Loading/> : null}
    <View style={ui.grid}>
      <Card style={{ flex: 2, minWidth: width > 700 ? 320 : 220 }}>
        <Text style={ui.eyebrow}>{next ? classStatus(next, now) === 'Scheduled now' ? 'CURRENT CLASS' : 'NEXT CLASS' : 'TODAY’S CLASSES'}</Text>
        <Text style={ui.h2}>{next ? next.subject : data.timetable ? 'No more classes today' : 'No timetable saved'}</Text>
        <Text style={ui.muted}>{next ? `${next.start}–${next.end} IST · ${next.room ? 'Room ' + next.room : 'Room not provided'}` : data.timetable ? 'Check IMS for any changes to your schedule.' : 'Save your timetable from IMS to see today’s classes.'}</Text>
        {next ? <Badge tone="info">{classStatus(next, now)} · {remaining.length} remaining</Badge> : null}
        <Button label={data.timetable ? 'View timetable' : 'Add timetable'} secondary icon="calendar" onPress={() => router.push(data.timetable ? '/(tabs)/timetable' : '/login')}/>
      </Card>
      <Card style={{ flex: 1, minWidth: 220 }}>
        <Text style={ui.eyebrow}>ATTENDANCE</Text>
        {pct !== null ? <Text style={{ color: '#F3F4F6', fontSize: 36, fontWeight: '700' }}>{pct.toFixed(1)}%</Text> : <Text style={ui.h2}>{data.attendance ? 'Overall unavailable' : 'No attendance saved'}</Text>}
        <Text style={ui.muted}>{pct === null ? data.attendance ? 'Some subjects are missing class counts.' : 'Save your attendance report to check your percentages.' : `${low.length} ${low.length === 1 ? 'subject' : 'subjects'} below your ${target}% target.`}</Text>
        <Button label={data.attendance ? 'View attendance' : 'Add attendance'} secondary icon="activity" onPress={() => router.push(data.attendance ? '/(tabs)/attendance' : '/login')}/>
      </Card>
    </View>
    {data.attendance || data.timetable ? <View style={ui.row}><Badge>Saved on this device</Badge><Text style={ui.small}>{freshness(data.attendance?.capturedAt ?? data.timetable?.capturedAt)}</Text></View> : null}
    {remaining.length > 1 ? <View style={{ gap: 12 }}><Text style={ui.h2}>Later today</Text>{remaining.slice(1, 4).map(e => <Card key={e.id}><View style={ui.row}><Text style={{ color: '#E98A91', fontSize: 16, fontWeight: '600' }}>{e.start}</Text><View style={{ flex: 1 }}><Text style={ui.h3}>{e.subject}</Text><Text style={ui.small}>{e.room ? `Room ${e.room}` : 'Room not provided'} · ends {e.end}</Text></View></View></Card>)}</View> : null}
    <View style={{ gap: 12 }}><Text style={ui.h2}>Campus</Text><View style={ui.row}><Button label="Rooms" secondary icon="map-pin" onPress={() => router.push('/(tabs)/rooms')}/><Button label="Notices" secondary icon="bell" onPress={() => router.push('/news')}/><Button label="Results" secondary icon="award" onPress={() => router.push('/results')}/></View></View>
  </Page>;
}
