import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api, RoomInfo } from '@/src/api';
import { Badge, Button, Card, Empty, Message, Page, ui } from '@/src/components/campus';
const LABELS = { available: 'Available by timetable', occupied: 'Occupied by timetable', unknown: 'Availability unknown' };
export default function Rooms() {
  const q = useQuery({ queryKey: ['rooms'], queryFn: api.rooms, refetchInterval: 60_000 });
  const [search, setSearch] = useState(''), [building, setBuilding] = useState('All'), [status, setStatus] = useState('All');
  const rooms = q.data?.rooms ?? [], buildings = ['All', ...new Set(rooms.map(r => r.building))];
  // A failed refresh invalidates the previous status; keep room metadata only.
  const safe = rooms.map(r => q.isError || q.data?.stale ? { ...r, status: 'unknown' as const, reason: 'The latest schedule could not be verified. Check on arrival.', minutes_until_change: null, next_class: null } : r);
  const visible = safe.filter(r => (building === 'All' || r.building === building) && (status === 'All' || r.status === status) && `${r.id} ${r.building} ${r.room_type}`.toLowerCase().includes(search.toLowerCase()));
  return <Page title="Rooms" subtitle="Availability from published timetables, not live occupancy." testID="rooms-root" action={<Button label={q.isFetching ? 'Refreshing…' : 'Refresh rooms'} disabled={q.isFetching} secondary icon="refresh-cw" onPress={() => { void q.refetch(); }}/> }>
    <TextInput accessibilityLabel="Search rooms, buildings, or room types" placeholder="Search room, block, or room type" placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} style={ui.input}/>
    <View style={ui.row}>{buildings.map(b => <Button key={b} label={b} secondary={building !== b} onPress={() => setBuilding(b)}/>)}</View>
    <View style={ui.row}>{(['All','available','occupied','unknown'] as const).map(s => <Button key={s} label={s === 'All' ? 'All statuses' : s === 'available' ? 'Available' : s === 'occupied' ? 'Occupied' : 'Unknown'} secondary={status !== s} onPress={() => setStatus(s)}/>)}</View>
    {q.isError ? <Message>{q.error.message} Cached room statuses are now unknown.</Message> : null}
    <Text style={ui.small}>{q.isPending ? 'Checking published schedules…' : q.data?.observed_at ? `Source checked ${new Date(q.data.observed_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST${q.data.stale ? ' · OUTDATED' : ''}` : 'No verified schedule available.'} · Updates every minute.</Text>
    {!visible.length && !q.isPending ? <Empty icon="map-pin" title={rooms.length ? 'No matching rooms' : 'Room schedules unavailable'} message={rooms.length ? 'Try another filter or room name.' : 'No current room schedule has been published. Check the room on arrival.'}/> : null}
    <View style={ui.grid}>{visible.map(room => <RoomCard key={room.id} room={room}/>)}</View>
  </Page>;
}
function RoomCard({ room }: { room: RoomInfo }) {
  return <Card style={{ flexGrow: 1, flexBasis: 280 }}><View style={ui.row}><Text style={ui.h2}>{room.id}</Text><Badge tone={room.status === 'available' ? 'success' : room.status === 'occupied' ? 'warning' : 'muted'}>{LABELS[room.status]}</Badge></View><Text style={ui.muted}>{room.building} · {room.room_type}</Text><Text style={ui.small}>{room.reason}</Text>{room.minutes_until_change !== null ? <Text style={ui.text}>{room.status === 'occupied' ? 'Current booking block ends' : 'Availability window ends'} in {room.minutes_until_change} min</Text> : null}{room.next_class ? <Text style={ui.small}>Next scheduled: {room.next_class.title} · {room.next_class.start}–{room.next_class.end} IST</Text> : null}</Card>;
}
