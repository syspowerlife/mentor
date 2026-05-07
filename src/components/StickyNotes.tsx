import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Clock, 
  StickyNote as StickyNoteIcon,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';

interface StickyNoteProps {
  id?: string;
  content: string;
  color: NoteColor;
  createdAt: any;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string, color: NoteColor) => void;
}

const colorMap: Record<NoteColor, { bg: string; border: string; accent: string; text: string }> = {
  yellow: { 
    bg: 'bg-yellow-100', 
    border: 'border-yellow-200', 
    accent: 'bg-yellow-400',
    text: 'text-yellow-900'
  },
  blue: { 
    bg: 'bg-blue-100', 
    border: 'border-blue-200', 
    accent: 'bg-blue-400',
    text: 'text-blue-900'
  },
  green: { 
    bg: 'bg-green-100', 
    border: 'border-green-200', 
    accent: 'bg-green-400',
    text: 'text-green-900'
  },
  pink: { 
    bg: 'bg-pink-100', 
    border: 'border-pink-200', 
    accent: 'bg-pink-400',
    text: 'text-pink-900'
  },
  purple: { 
    bg: 'bg-purple-100', 
    border: 'border-purple-200', 
    accent: 'bg-purple-400',
    text: 'text-purple-900'
  },
  gray: { 
    bg: 'bg-slate-100', 
    border: 'border-slate-200', 
    accent: 'bg-slate-400',
    text: 'text-slate-900'
  },
};

export const StickyNote: React.FC<StickyNoteProps> = ({ 
  id, 
  content, 
  color = 'yellow', 
  createdAt, 
  onDelete, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const colors = Object.keys(colorMap) as NoteColor[];

  const handleSave = () => {
    if (id && onUpdate) {
      onUpdate(id, editContent, color);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const activeColor = colorMap[color] || colorMap.yellow;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        "relative rounded-xl border-2 p-5 shadow-sm min-h-[160px] flex flex-col group transition-all hover:shadow-md",
        activeColor.bg,
        activeColor.border
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500/70 uppercase tracking-tighter">
          <Clock className="w-3 h-3" />
          {createdAt ? format(new Date(createdAt), "dd MMM, HH:mm", { locale: ptBR }) : 'Recentemente'}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-white/50">
                    <Palette className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="grid grid-cols-3 gap-1 p-2 w-32">
                  {colors.map((c) => (
                    <DropdownMenuItem 
                      key={c} 
                      className={cn(
                        "h-6 w-full rounded-full cursor-pointer border",
                        colorMap[c].bg,
                        c === color ? "ring-2 ring-slate-800" : ""
                      )}
                      onClick={() => onUpdate && id && onUpdate(id, content, c)}
                    />
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-500 hover:text-blue-600 hover:bg-white/50"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-slate-500 hover:text-red-600 hover:bg-white/50"
                onClick={() => id && onDelete && onDelete(id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 bg-white/50 border-none resize-none focus-visible:ring-0 text-sm leading-relaxed p-0 h-full"
            autoFocus
          />
          <div className="flex justify-end gap-1 mt-2">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <p className={cn("text-sm leading-relaxed whitespace-pre-wrap flex-1", activeColor.text)}>
          {content}
        </p>
      )}

      {/* Folded corner effect for a "sticky note" look */}
      <div className={cn(
        "absolute bottom-0 right-0 w-8 h-8 opacity-20",
        "bg-gradient-to-tl from-slate-900/10 to-transparent rounded-br-xl"
      )} style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
    </motion.div>
  );
};

interface StickyNotesProps {
  notes: any[];
  onAdd: (content: string, color: NoteColor) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, content: string, color: NoteColor) => Promise<void>;
}

export const StickyNotes: React.FC<StickyNotesProps> = ({ 
  notes, 
  onAdd, 
  onDelete, 
  onUpdate 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');

  const handleAdd = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await onAdd(newNoteContent.trim(), selectedColor);
      setNewNoteContent('');
      setIsAdding(false);
    } catch (error) {
      // toast is handled by parent or here
    }
  };

  const colors = Object.keys(colorMap) as NoteColor[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-lg">
            <StickyNoteIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Notas Rápidas</h3>
            <p className="text-xs text-slate-500">Registre insights e observações rápidas.</p>
          </div>
        </div>
        {!isAdding && (
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 h-9 px-4 gap-2 shadow-sm transition-all hover:shadow-md"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Nota
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className={cn(
                "rounded-xl border-2 p-5 shadow-lg flex flex-col min-h-[200px] border-dashed",
                colorMap[selectedColor].bg,
                colorMap[selectedColor].border
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nova Draft</span>
                <div className="flex gap-1">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border transition-all",
                        colorMap[c].bg,
                        selectedColor === c ? "ring-2 ring-slate-800 scale-110" : "scale-90 opacity-60"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <Textarea
                placeholder="O que você está pensando agora?"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="flex-1 bg-white/50 border-none resize-none focus-visible:ring-0 py-2 px-0 text-sm leading-relaxed"
                autoFocus
              />

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-black/5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-500 hover:bg-white/50 px-3" 
                  onClick={() => setIsAdding(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4"
                  onClick={handleAdd}
                  disabled={!newNoteContent.trim()}
                >
                  Salvar
                </Button>
              </div>
            </motion.div>
          )}

          {notes.map((note) => (
            <StickyNote
              key={note.id}
              id={note.id}
              content={note.content}
              color={note.color || 'yellow'}
              createdAt={note.created_at?.toDate ? note.created_at.toDate() : note.created_at}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </AnimatePresence>

        {!isAdding && notes.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <StickyNoteIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Nenhuma nota por aqui ainda.</p>
            <p className="text-slate-400 text-sm mt-1">Clique em "Nova Nota" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
