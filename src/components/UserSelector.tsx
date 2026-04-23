import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface UserSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function UserSelector({ value, onChange }: UserSelectorProps) {
  const [users, setUsers] = useState<any[]>([]);
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!isAdmin || loading) return;

    async function loadUsers() {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
      } catch (e) {
        console.error('Error loading users in UserSelector:', e);
      }
    }
    loadUsers();
  }, [isAdmin, loading]);

  if (!isAdmin) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Selecione um cliente" />
      </SelectTrigger>
      <SelectContent>
        {users.map(u => (
          <SelectItem key={u.id} value={u.id}>
            {u.name || u.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
