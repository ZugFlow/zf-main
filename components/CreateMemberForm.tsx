import { useState } from 'react';

export default function CreateMemberForm({ salonId, onMemberCreated }: { 
  salonId: string;
  onMemberCreated?: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleCreateMember = async () => {
    setLoading(true);
    const res = await fetch('/api/member/create-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        salon_id: salonId
      })
    });

    const json = await res.json();
    setLoading(false);    if (json.success) {
      alert('Collaboratore creato!');
      setEmail('');
      setName('');
      setPassword('');
      
      // Chiamare la callback se fornita
      if (onMemberCreated) {
        onMemberCreated();
      }
    } else {
      alert('Errore: ' + json.error);
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-md">
      <h2 className="text-lg font-semibold mb-2">Aggiungi Collaboratore</h2>
      <input
        className="w-full p-2 border mb-2"
        type="text"
        placeholder="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full p-2 border mb-2"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full p-2 border mb-2"
        type="password"
        placeholder="Password provvisoria"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleCreateMember}
        disabled={loading}
      >
        {loading ? 'Creazione...' : 'Crea Collaboratore'}
      </button>
    </div>
  );
}
