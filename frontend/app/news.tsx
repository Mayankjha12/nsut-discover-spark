import { Linking, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { api } from '@/src/api';
import { Badge, Button, Card, Empty, Message, Page, ui } from '@/src/components/campus';
export default function News() {
  const [search, setSearch] = useState('');
  const router = useRouter(), [exams, setExams] = useState(false), [linkError,setLinkError] = useState('');
  const q = useQuery({ queryKey: ['notices'], queryFn: api.notices, staleTime: 5 * 60_000 });
  const items = (q.data?.items ?? []).filter(n => (!exams || /exam|date.?sheet|assessment/i.test(n.title)) && n.title.toLowerCase().includes(search.toLowerCase()));
  return <Page title="On the noticeboard" subtitle="Official campus announcements, with their source and freshness." action={<Button label="Back to Today" secondary onPress={() => router.replace('/(tabs)')}/> }>
    <TextInput accessibilityLabel="Search official notices" placeholder="Search notice titles" placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} style={ui.input}/>
    <View style={ui.row}><Button label="All notices" secondary={exams} onPress={() => setExams(false)}/><Button label="Examination notices" secondary={!exams} onPress={() => setExams(true)}/><Button label={q.isFetching ? 'Refreshing…' : 'Refresh'} disabled={q.isFetching} secondary onPress={() => { void q.refetch(); }}/></View>
    {q.error ? <Message>{q.error.message}</Message> : null}{q.data?.message ? <Message>{q.data.message}</Message> : null}{linkError ? <Message>{linkError}</Message> : null}
    <Text style={ui.small}>{q.isPending ? 'Loading notices…' : q.data?.fetched_at ? `Last successful fetch: ${new Date(q.data.fetched_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST` : 'No successful synchronization yet.'}</Text>
    {q.data?.stale || q.isError ? <Badge tone="warning">Cached notices may be outdated</Badge> : null}
    {!items.length && !q.isPending ? <Empty icon="bell" title="Nothing verified to show here yet" message={exams ? 'No examination notices in the current feed. Consult the official portal.' : 'The official feed is unavailable or no notices were returned. No sample announcements are displayed.'}><Button label="Visit NSUT website" secondary icon="external-link" onPress={() => { Linking.openURL('https://nsut.ac.in/en/home').catch(() => setLinkError('Could not open the website.')); }}/></Empty> : null}
    {items.map(n => <Card key={n.url}><Text style={ui.h3}>{n.title}</Text><Text style={ui.small}>{n.source}</Text><Button label="Read official notice" secondary icon="external-link" onPress={() => { try { const u = new URL(n.url); if (u.protocol !== 'https:' || u.username || u.password) throw new Error(); Linking.openURL(u.href).catch(() => setLinkError('Could not open this notice.')); } catch { setLinkError('This notice has an unsupported link.'); } }}/></Card>)}
  </Page>;
}
