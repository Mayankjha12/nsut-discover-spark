import { useState } from 'react';
import { Linking, Platform, Text, TextInput, View, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge, Button, Card, Message, Page, ui } from '@/src/components/campus';
import { useAcademic } from '@/src/use-academic';
import { normalizeBackup } from '@/src/domain/academic';
import { storage } from '@/src/storage';
import { queryClient } from '@/src/query-client';
import { IMS_URL } from '@/src/domain/portal';
export default function More() {
  const { data, target } = useAcademic(), router = useRouter();
  const [savedTarget, setSavedTarget] = useState<number | null>(null);
  const [input, setInput] = useState(''), [targetInput, setTarget] = useState(''), [message, setMessage] = useState(''), [confirm, setConfirm] = useState(false);
  async function exportBackup() {
    try {
      const current = await storage.read();
      if (!current.attendance && !current.timetable) { setMessage('No saved academic data to export.'); return; }
      const value = JSON.stringify(current, null, 2);
      if (Platform.OS === 'web') { const url = URL.createObjectURL(new Blob([value], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'discover-spark-personal-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
      else await Share.share({ message: value, title: 'Discover Spark personal backup' });
    } catch { setMessage('Backup could not be exported.'); }
  }
  return <Page title="Make it yours" subtitle="Preferences, privacy, and your campus essentials." testID="more-root">
    {message ? <Message>{message}</Message> : null}
    <Card><Text style={ui.h2}>{data.profile?.name ?? 'Your campus companion'}</Text>{data.profile?.roll ? <Text style={ui.muted}>{data.profile.roll}{data.profile.branch ? ` · ${data.profile.branch}` : ''}</Text> : null}<Badge>{data.attendance || data.timetable ? 'Local academic data · not an active IMS session' : 'No academic data saved'}</Badge><Button label="Connect or refresh IMS" icon="refresh-cw" onPress={() => router.push('/login')}/></Card>
    <Card><Text style={ui.h2}>Your attendance target</Text><Text style={ui.muted}>Current personal target: {savedTarget ?? target}%. This is a planning preference. Verify the applicable attendance rule for your course with NSUT; we have not verified a universal institutional requirement.</Text><TextInput accessibilityLabel="Personal attendance target percentage" keyboardType="number-pad" placeholder={`${target}`} placeholderTextColor="#9CA3AF" value={targetInput} onChangeText={setTarget} maxLength={3} style={ui.input}/><Button label="Save attendance target" onPress={async () => { try { await storage.setTarget(Number(targetInput)); setSavedTarget(Number(targetInput)); setMessage('Target saved. Attendance estimates will use it when you open Attendance.'); } catch { setMessage('Enter a whole-number percentage between 1 and 100.'); } }}/></Card>
    <View style={ui.row}><Button label="Results · Coming soon" secondary icon="award" onPress={() => router.push('/results')}/><Button label="Official notices" secondary icon="bell" onPress={() => router.push('/news')}/></View>
    <Card><Text style={ui.h2}>Move your own data</Text><Text style={ui.muted}>Export a Discover Spark backup from a device you synced, then import it here. This is our backup format, not a claimed IMS export format. Imported records are marked as a personal backup. Keep exports private: they contain academic information.</Text><Button label="Export personal backup" secondary onPress={exportBackup}/><TextInput accessibilityLabel="Personal backup JSON" multiline value={input} onChangeText={setInput} maxLength={200000} placeholder="Paste your Discover Spark backup JSON" placeholderTextColor="#9CA3AF" style={[ui.input, { minHeight: 120, textAlignVertical: 'top' }]}/><Button label="Import personal backup" onPress={async () => { try { const valid = normalizeBackup(JSON.parse(input)); await storage.save(valid); setInput(''); queryClient.clear(); setMessage('Backup validated and saved locally. Open Today to see it.'); } catch { setMessage('Invalid backup. Check the version, counts, dates, and timetable times. Your existing data was kept.'); } }}/></Card>
    <Card><Text style={ui.h2}>Privacy by default</Text><Text style={ui.muted}>IMS passwords and cookies are never saved by the app or sent to its backend. Native academic caches use encrypted device storage; web caches stay in this browser. Shared room schedules contain no student records.</Text><Button label="Clear data on this device" secondary onPress={() => setConfirm(true)}/>{confirm ? <><Message>This removes your academic data, history, and preferences from this device. Export a private backup first if needed.</Message><View style={ui.row}><Button label="Confirm clear" onPress={async () => { try { await storage.clear(); queryClient.clear(); router.replace('/'); } catch { setMessage('Some data could not be cleared. Please retry.'); } }}/><Button label="Cancel" secondary onPress={() => setConfirm(false)}/></View></> : null}</Card>
    <View style={ui.row}>{[['Official IMS',IMS_URL],['NSUT website','https://nsut.ac.in/en/home'],['Campus map','https://maps.google.com/?q=Netaji+Subhas+University+of+Technology+Dwarka']].map(([label,url]) => <Button key={label} label={label} secondary icon="external-link" onPress={() => { Linking.openURL(url).catch(() => setMessage('Could not open this link.')); }}/>)}</View>
    <Text style={ui.small}>NSUT Discover Spark · Independent student project. Not an official NSUT, IMS, or ResultsHub service.</Text>
  </Page>;
}
