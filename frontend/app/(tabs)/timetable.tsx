import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Badge, Button, Card, Empty, Loading, Message, Page, ui } from "@/src/components/campus";
import { classStatus, dayClasses, DAYS, freshness, istTime, minutes } from "@/src/domain/academic";
import { useAcademic, useNow } from "@/src/use-academic";
export default function Timetable() {
  const { data, loading, error } = useAcademic(), now = useNow(), router = useRouter();
  const [selected, setSelected] = useState<number | null>(null), [weekly, setWeekly] = useState(false);
  const day = selected ?? istTime(now).day, events = data.timetable?.data ?? [];
  const days = weekly ? DAYS.map((_, i) => i) : [day];
  return <Page title="Your week, in focus" subtitle="Personal timetable · all times in Asia/Kolkata (IST)" testID="timetable-root" action={<Button label="Sync timetable" icon="refresh-cw" onPress={() => router.push('/login')}/> }>
    {error ? <Message>{error}</Message> : null}{loading ? <Loading/> : null}
    <View style={ui.row}>{DAYS.map((d,i) => <Button key={d} label={d} secondary={i !== day || weekly} onPress={() => { setSelected(i); setWeekly(false); }}/>)}</View>
    <View style={ui.row}><Button label={weekly ? "Daily view" : "Weekly view"} secondary onPress={() => setWeekly(!weekly)}/><Button label="Today" secondary onPress={() => { setSelected(null); setWeekly(false); }}/>{data.timetable ? <Text style={ui.small}>{freshness(data.timetable.capturedAt)} · {data.timetable.source === 'ims-page' ? 'IMS page' : 'Personal backup'}</Text> : null}</View>
    {!data.timetable && !loading ? <Empty icon="calendar" title="Your timetable starts here" message="No timetable has been synced. We won’t fill your week with sample classes."><Button label="Connect to IMS" onPress={() => router.push('/login')}/></Empty> : null}
    {data.timetable ? days.map(d => {
      const list = dayClasses(events, d); let occupiedUntil = -1;
      return <View key={d} style={{ gap: 12 }}><Text style={ui.h2}>{DAYS[d]}{d === istTime(now).day ? ' · Today' : ''}</Text>{!list.length ? <Card><Text style={ui.muted}>No classes in your saved timetable for this day. Check IMS if your schedule has changed.</Text></Card> : list.map(e => {
        const gap = !e.cancelled && occupiedUntil >= 0 && minutes(e.start)! > occupiedUntil ? minutes(e.start)! - occupiedUntil : 0;
        const overlap = !e.cancelled && minutes(e.start)! < occupiedUntil;
        if (!e.cancelled) occupiedUntil = Math.max(occupiedUntil, minutes(e.end)!);
        const status = classStatus(e, now);
        return <View key={e.id} style={{ gap: 12 }}>{gap > 0 ? <Text style={ui.small}>{gap} min gap in saved timetable</Text> : null}<Card style={{ borderLeftWidth: 3, borderLeftColor: status === 'Scheduled now' ? '#78DCC8' : '#394250' }}><View style={ui.row}><Text style={ui.h3}>{e.start} — {e.end}</Text><Badge tone={status === 'Scheduled now' ? 'success' : 'muted'}>{status}</Badge>{overlap ? <Badge tone="warning">Schedule conflict</Badge> : null}</View><Text style={ui.h2}>{e.subject}</Text><Text style={ui.muted}>{e.room ? `Room ${e.room}` : 'Room not provided'}{e.faculty ? ` · ${e.faculty}` : ''}</Text></Card></View>;
      })}</View>;
    }) : null}
  </Page>;
}
