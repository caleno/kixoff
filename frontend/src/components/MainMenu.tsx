import type { PlayerProfile, Screen } from '../types';
interface Props { player: PlayerProfile; navigate: (screen: Screen) => void; }
export function MainMenu({ player, navigate }: Props) { return (<div><button onClick={() => navigate('play')}>Play</button><button onClick={() => navigate('profile')}>Profile</button></div>); }
