import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { API_ORIGIN, getApiErrorMessage } from '../../api/axiosConfig';
import useAuthStore from '../../store/authStore';
import { getInitials, getMediaUrl } from '../../utils/media';
import WidgetCardShell from './WidgetCardShell';

const previewMessages = [
  {
    id: 'preview-1',
    text: 'On se retrouve a quelle heure ?',
    createdAt: new Date().toISOString(),
    user: { id: 1, name: 'Nico', avatar: null },
  },
  {
    id: 'preview-2',
    text: '20h30, je reserve le resto.',
    createdAt: new Date().toISOString(),
    user: { id: 2, name: 'Lea', avatar: null },
  },
];

const formatMessageTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function MessageAvatar({ user }) {
  const mediaUrl = getMediaUrl(user?.avatar);
  const name = user?.name || 'Utilisateur';

  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full object-cover shadow-halo"
      />
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-golden-primary text-[10px] font-black text-gray-900 shadow-halo">
      {getInitials(name)}
    </span>
  );
}

function MessageBubble({ message, isOwnMessage }) {
  return (
    <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && <MessageAvatar user={message.user} />}

      <div className={`flex max-w-[78%] flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-golden px-4 py-2 shadow-halo ${
          isOwnMessage
            ? 'bg-golden-primary text-gray-900'
            : 'bg-white text-gray-900'
        }`}>
          {!isOwnMessage && (
            <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.14em] text-golden-muted">
              {message.user?.name || 'Utilisateur'}
            </p>
          )}
          <p className="break-words text-[clamp(0.72rem,1.7cqw,0.86rem)] font-semibold leading-snug">
            {message.text}
          </p>
        </div>
        <span className="mt-1 px-2 text-[10px] font-bold text-gray-400">
          {formatMessageTime(message.createdAt)}
        </span>
      </div>

      {isOwnMessage && <MessageAvatar user={message.user} />}
    </div>
  );
}

export default function ChatWidgetCard(props) {
  const {
    widget,
    isDragging = false,
  } = props;
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const title = widget.data?.title || 'Chat du groupe';
  const groupId = widget.groupId;
  const widgetId = widget.id;
  const isPreview = typeof widgetId !== 'number';
  const [messages, setMessages] = useState(() => (isPreview ? previewMessages : []));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(!isPreview);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const statusLabel = useMemo(() => {
    if (isPreview) return 'Apercu';
    if (error) return 'Hors ligne';
    return 'Temps reel';
  }, [error, isPreview]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (isPreview || !widgetId || !token) return undefined;

    let ignore = false;
    setIsLoading(true);

    api.get(`/widgets/${widgetId}/messages`)
      .then(({ data }) => {
        if (!ignore) {
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          setError('');
        }
      })
      .catch((requestError) => {
        if (!ignore) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isPreview, token, widgetId]);

  useEffect(() => {
    if (isPreview || !groupId || !token) return undefined;

    const socket = io(API_ORIGIN, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_group', { groupId }, (response) => {
        if (!response?.ok) {
          setError(response?.message || 'Connexion au chat impossible.');
        } else {
          setError('');
        }
      });
    });

    socket.on('connect_error', (socketError) => {
      setError(socketError?.message || 'Connexion au chat impossible.');
    });

    socket.on('receive_message', (message) => {
      if (Number(message?.groupId) !== Number(groupId)) return;

      setMessages((previousMessages) => {
        if (previousMessages.some((existingMessage) => existingMessage.id === message.id)) {
          return previousMessages;
        }

        return [...previousMessages, message];
      });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('receive_message');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [groupId, isPreview, token]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const text = input.trim();
    if (!text || isPreview || isSending) return;

    setIsSending(true);
    setError('');

    if (!socketRef.current?.connected) {
      setError('Connexion au chat en cours. Reessayez dans un instant.');
      setIsSending(false);
      return;
    }

    socketRef.current.emit('send_message', { groupId, text }, (response) => {
      setIsSending(false);

      if (!response?.ok) {
        setError(response?.message || "Impossible d'envoyer le message.");
        return;
      }

      setInput('');
    });
  };

  const canInteract = !isDragging;

  return (
    <WidgetCardShell
      {...props}
      typeLabel="Chat"
      showTypeLabel={false}
      className="[container-type:inline-size] bg-[#FDFEF4]"
      controlsTone="dark"
    >
      <div
        className={`flex h-full min-h-0 flex-col gap-[clamp(0.5rem,1.8cqw,0.85rem)] ${canInteract ? '' : 'pointer-events-none'}`}
      >
        <div className="min-w-0 shrink-0 pr-24">
          <p className="text-[clamp(0.5rem,1.4cqw,0.62rem)] font-black uppercase tracking-[0.24em] text-golden-muted">
            Chat
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 truncate text-[clamp(1rem,3.1cqw,1.55rem)] font-black leading-none text-gray-900">
              {title}
            </h3>
            <span className="shrink-0 rounded-golden bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-golden-muted shadow-halo">
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-golden bg-white/70 px-3 py-3 shadow-creuse">
          {isLoading && (
            <p className="text-center text-xs font-bold text-golden-muted">Chargement du chat...</p>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center">
              <p className="max-w-[18rem] text-sm font-bold text-golden-muted">
                Aucun message pour l'instant. Lance la conversation du groupe.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={Number(message.user?.id) === Number(currentUser?.id)}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {error && (
          <p className="shrink-0 rounded-golden bg-red-100 px-4 py-2 text-xs font-bold text-red-700 shadow-halo">
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          onPointerDown={(event) => event.stopPropagation()}
          className="flex shrink-0 items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={500}
            disabled={isPreview || isSending}
            placeholder={isPreview ? 'Apercu du chat' : 'Ecrire un message...'}
            className="min-w-0 flex-1 rounded-golden bg-golden-input px-4 py-3 text-sm font-semibold text-gray-900 shadow-creuse focus:outline-none focus:ring-2 focus:ring-golden-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isPreview || isSending || !input.trim()}
            className="shrink-0 rounded-golden bg-golden-primary px-5 py-3 text-sm font-black text-gray-900 shadow-halo transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? '...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </WidgetCardShell>
  );
}
