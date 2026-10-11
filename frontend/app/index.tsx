import { Redirect } from 'expo-router';
import { Loading } from '@/src/components/campus';
import { useIMSSession } from '@/src/ims-session';
export default function Entry() {
  const { ready, session } = useIMSSession();
  if (!ready) return <Loading/>;
  return <Redirect href={session ? '/(tabs)' : '/login'}/>;
}
