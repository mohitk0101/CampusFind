import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import { createChatSocket } from '../utils/socket';

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPost = searchParams.get('post');
  const initialUser = searchParams.get('user');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [activeConv, setActiveConv] = useState(null); // { postId, userId, otherUser, post }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [postContext, setPostContext] = useState(null);
  const [isDeletingConv, setIsDeletingConv] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const user = CF.getUser();
  const userId = user?._id?.toString();

  const messagesEndRef = useRef(null);

  const socketRef = useRef(null);
  const imageInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Keep the mobile chat composer and bottom navigation above the on-screen keyboard.
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 620) return;

    const root = document.documentElement;
    const viewport = window.visualViewport;

    const updateViewport = () => {
      const visibleHeight = viewport?.height || window.innerHeight;
      const keyboardHeight = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0;

      root.style.setProperty('--cf-visible-height', `${visibleHeight}px`);
      root.style.setProperty('--cf-keyboard-height', `${keyboardHeight}px`);
    };

    updateViewport();
    viewport?.addEventListener('resize', updateViewport);
    viewport?.addEventListener('scroll', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      viewport?.removeEventListener('resize', updateViewport);
      viewport?.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
      root.style.removeProperty('--cf-visible-height');
      root.style.removeProperty('--cf-keyboard-height');
    };
  }, []);

  // ─── Scroll to bottom ────────────────────────────────────────────────────
  const scrollToBottom = (force = false) => {
    setTimeout(() => {
      const el = messagesEndRef.current;
      if (!el) return;
      el.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
    }, 80);
  };

  // ─── Load conversations list ──────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await CF.apiGet('/messages/conversations');
      const convs = data.conversations || [];
      setConversations(convs);
      return convs;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  // ─── Load messages for active conversation ────────────────────────────────
  const loadMessages = useCallback(async (conv) => {
    if (!conv) return;
    try {
      const data = await CF.apiGet(`/messages/${conv.postId}/${conv.userId}`);
      setMessages(data.messages || []);
      // The API marks incoming messages as read when this thread is fetched.
      // Refresh the conversation list so its unread badge clears immediately.
      // Do not force-scroll on conversation open: let the user choose their position.
      await loadConversations();
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── Load post context (for resolution bar) ───────────────────────────────
  const loadPostContext = useCallback(async (postId) => {
    try {
      const data = await CF.apiGet(`/posts/${postId}`);
      setPostContext(data.post);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── Open a conversation ──────────────────────────────────────────────────
  const openConversation = useCallback((conv) => {
    const convKey = {
      postId: conv.post?._id,
      userId: conv.otherUser?._id,
      otherUser: conv.otherUser,
      post: conv.post,
    };
    setActiveConv(convKey);
    setMessages([]);
    setPostContext(null);
    setPendingImage(null);
    setIsLoadingMessages(true);
    loadMessages(convKey).finally(() => {
      setIsLoadingMessages(false);
    });
    loadPostContext(conv.post?._id);
  }, [loadMessages, loadPostContext]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!CF.isLoggedIn()) { navigate('/auth'); return; }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const init = async () => {
      try {
        setIsLoadingConvs(true);
        const convs = await loadConversations();
        const currentUserId = CF.getUser()?._id;

        if (initialPost && initialUser) {
          // Try to find matching conversation in existing list
          const match = convs.find(c =>
            c.post?._id?.toString() === initialPost &&
            c.otherUser?._id?.toString() === initialUser
          );
          if (match) {
            openConversation(match);
            return;
          }

          // If not found, fetch post details to open a new conversation
          try {
            const postRes = await CF.apiGet(`/posts/${initialPost}`);
            const post = postRes.post;
            if (post) {
              const isMeReporter = (post.reporter?._id || post.reporter)?.toString() === currentUserId?.toString();
              let otherUser = post.reporter;
              if (isMeReporter) {
                otherUser = {
                  _id: initialUser,
                  name: 'Student'
                };
              }
              const mockConv = {
                post: post,
                otherUser: otherUser
              };
              openConversation(mockConv);
              return;
            }
          } catch (e) {
            console.error('Failed to load post context for new conversation:', e);
          }
        }

        // Default fallback: open the first conversation in the list
        if (convs.length > 0) {
          // Auto-open only on larger screens (desktop/tablet), show list on mobile
          if (window.innerWidth > 900) {
            openConversation(convs[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingConvs(false);
      }
    };
    init();
  }, []);


  // ─── Realtime chat via Socket.IO (no recurring message polling) ───────────
  useEffect(() => {
    if (!CF.isLoggedIn()) return;
    const socket = createChatSocket();
    socketRef.current = socket;

    socket.on('conversation:updated', () => {
      loadConversations();
    });
    socket.on('connect_error', (err) => {
      console.warn('CampusFind realtime connection failed:', err.message);
    });
    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadConversations]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !activeConv?.postId || !activeConv?.userId) return;

    const conversation = {
      postId: activeConv.postId,
      otherUserId: activeConv.userId,
    };
    const joinConversation = () => {
  socket.emit('conversation:join', conversation, (result) => {
    console.log('Conversation join result:', result);
  });
};
    const handleNewMessage = (message) => {
      const postId = String(message.post?._id || message.post || '');
      const senderId = String(message.sender?._id || message.sender || '');
      const receiverId = String(message.receiver?._id || message.receiver || '');
      const belongsToActive = postId === String(activeConv.postId) &&
        [senderId, receiverId].includes(String(userId)) &&
        [senderId, receiverId].includes(String(activeConv.userId));
      if (!belongsToActive) return;
      setMessages((prev) => prev.some((item) => String(item._id) === String(message._id))
        ? prev
        : [...prev, message]);
      scrollToBottom();
    };

    if (socket.connected) joinConversation();
    socket.on('connect', joinConversation);
    socket.on('message:new', handleNewMessage);
    return () => {
      socket.emit('conversation:leave', conversation);
      socket.off('connect', joinConversation);
      socket.off('message:new', handleNewMessage);
    };
  }, [activeConv, userId]);


  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !pendingImage) || !activeConv) return;
    setIsSending(true);
    try {
      const body = {
        postId: activeConv.postId,
        receiverId: activeConv.userId,
        text: text.trim() || '📷 Image',
        image: pendingImage || null,
      };
      const data = await CF.apiPost('/messages', body);
      setMessages(prev => prev.some(item => String(item._id) === String(data.message._id))
        ? prev
        : [...prev, data.message]);
      setText('');
      setPendingImage(null);
      // Keep the composer focused so mobile users can send another message
      // without reopening the keyboard. The input stays enabled while sending.
      requestAnimationFrame(() => {
        messageInputRef.current?.focus({ preventScroll: true });
      });
      scrollToBottom(true);
      loadConversations();
    } catch (err) {
      alert(err.message);
    }
    setIsSending(false);
  };

  // ─── Image attachment ─────────────────────────────────────────────────────
  const handleImageAttach = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const b64 = await CF.fileToBase64(file);
      setPendingImage(b64);
      alert('Image attached! Type an optional message and press Send.');
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };

  // ─── Resolution bar actions ───────────────────────────────────────────────
  const confirmHandover = async () => {
    if (!window.confirm('Confirm you handed over this item? Both parties must confirm to resolve.')) return;
    try {
      await CF.apiPut(`/posts/${activeConv.postId}/confirm-handover`, { counterpartyId: activeConv.userId });
      alert('Handover confirmed!');
      loadPostContext(activeConv.postId);
    } catch (e) { alert(e.message); }
  };

  const confirmReceipt = async () => {
    if (!window.confirm('Confirm you received this item? Both parties must confirm to resolve.')) return;
    try {
      await CF.apiPut(`/posts/${activeConv.postId}/confirm-receipt`, { counterpartyId: activeConv.userId });
      alert('Receipt confirmed!');
      loadPostContext(activeConv.postId);
    } catch (e) { alert(e.message); }
  };

  // ─── Delete conversation ──────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!window.confirm('Delete this entire conversation? This cannot be undone.')) return;
    setIsDeletingConv(true);
    try {
      await CF.apiDelete(`/messages/${activeConv.postId}/${activeConv.userId}`);
      setActiveConv(null);
      setMessages([]);
      setPostContext(null);
      await loadConversations();
    } catch (e) {
      alert(e.message);
    }
    setIsDeletingConv(false);
  };

  // ─── Resolution bar content ───────────────────────────────────────────────
  const renderResolutionBar = () => {
    const post = postContext;
    if (!post || !user || post.status !== 'active') return null;

    const currentUserId = user._id?.toString();
    const isReporter = (post.reporter?._id || post.reporter)?.toString() === currentUserId;

    const finderId = (post.finder?._id || post.finder)?.toString();
    const ownerId = (post.owner?._id || post.owner)?.toString();

    let content = null;

    if (post.type === 'lost') {
      if (isReporter) {
        // Owner sees Confirm Receipt only after someone claimed it
        if (!post.finder) {
          content = <span className="text-sm">⏳ Waiting for someone to claim they found this item.</span>;
        } else if (post.ownerConfirmed) {
          content = <span className="text-sm">⏳ Receipt confirmed. Waiting for finder to confirm handover.</span>;
        } else {
          content = (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
              <span className="text-sm">🤝 Did you receive your lost item from the finder?</span>
              <button className="btn btn-secondary btn-sm" onClick={confirmReceipt}>✅ Confirm Receipt</button>
            </div>
          );
        }
      } else {
        // Finder (the counterparty who claimed it) sees Confirm Handover
        if (finderId === currentUserId) {
          if (post.finderConfirmed) {
            content = <span className="text-sm">⏳ Handover confirmed. Waiting for owner to confirm receipt.</span>;
          } else {
            content = (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
                <span className="text-sm">🤝 Did you hand over this lost item to the owner?</span>
                <button className="btn btn-secondary btn-sm" onClick={confirmHandover}>🤝 Confirm Handover</button>
              </div>
            );
          }
        }
      }
    } else { // found post
      if (isReporter) {
        // Finder sees Confirm Handover only after someone claimed it
        if (!post.owner) {
          content = <span className="text-sm">⏳ Waiting for owner to claim this found item.</span>;
        } else if (post.finderConfirmed) {
          content = <span className="text-sm">⏳ Handover confirmed. Waiting for owner to confirm receipt.</span>;
        } else {
          content = (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
              <span className="text-sm">🤝 Did you hand over this found item to the owner?</span>
              <button className="btn btn-secondary btn-sm" onClick={confirmHandover}>🤝 Confirm Handover</button>
            </div>
          );
        }
      } else {
        // Owner (the counterparty who claimed it) sees Confirm Receipt
        if (ownerId === currentUserId) {
          if (post.ownerConfirmed) {
            content = <span className="text-sm">⏳ Receipt confirmed. Waiting for finder to confirm handover.</span>;
          } else {
            content = (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
                <span className="text-sm">🤝 Did you receive this found item from the finder?</span>
                <button className="btn btn-secondary btn-sm" onClick={confirmReceipt}>✅ Confirm Receipt</button>
              </div>
            );
          }
        }
      }
    }

    if (!content) return null;
    return (
      <div style={{ background: 'var(--bg-elevated)', padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        {content}
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="main-content">
        <Topbar title="Messages" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className={`chat-layout ${activeConv ? 'has-active-conv' : ''}`} style={{ height: 'calc(100vh - var(--navbar-height))' }}>

          {/* ── Conversations List ─────────────────────────────────────────── */}
          <div className="conversations-list">
            <div className="conversation-list-heading">
              <div><strong>Messages</strong><small>Chat about reported items</small></div>
              <span>{conversations.length}</span>
            </div>
            <label className="conversation-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={conversationSearch} onChange={event => setConversationSearch(event.target.value)} placeholder="Search conversations..." aria-label="Search conversations"/></label>
            <div id="conv-items" style={{ overflowY: 'auto', flex: 1 }}>
              {isLoadingConvs ? (
                <div style={{ padding: '8px 16px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="skeleton-pulse" style={{ width: '40%', height: '12px', borderRadius: '4px' }} />
                        <div className="skeleton-pulse" style={{ width: '70%', height: '10px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 16px' }}>
                  <div className="empty-icon">💬</div>
                  <div className="empty-title">No messages</div>
                  <div className="empty-text">Start a conversation by contacting a post reporter.</div>
                </div>
              ) : (
                conversations.filter(conv => {
                  const term = conversationSearch.trim().toLowerCase();
                  if (!term) return true;
                  return [conv.otherUser?.name, conv.post?.itemName, conv.lastMessage?.text].some(value => String(value || '').toLowerCase().includes(term));
                }).map(conv => {
                  const isActive = activeConv && activeConv.postId === conv.post?._id && activeConv.userId === conv.otherUser?._id;
                  const initials = CF.getInitials(conv.otherUser?.name || 'U');
                  return (
                    <div
                      key={`${conv.post?._id}-${conv.otherUser?._id}`}
                      className={`conv-item ${isActive ? 'active' : ''}`}
                      onClick={() => openConversation(conv)}
                    >
                      <div className="conv-avatar">
                        {conv.otherUser?.profilePicture
                          ? <img src={conv.otherUser.profilePicture} alt={conv.otherUser.name} />
                          : initials}
                      </div>
                      <div className="conv-info">
                        <div className="conv-name">{conv.otherUser?.name || 'User'}</div>
                        <div className="conv-preview">
                          📦 {conv.post?.itemName} · {CF.truncate(conv.lastMessage?.text || '', 30)}
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="conv-unread">{conv.unreadCount}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Chat Area ──────────────────────────────────────────────────── */}
          <div className="chat-area">
            {activeConv ? (
              <>
                {/* Header */}
                <div className="chat-header">
                  <button 
                    type="button" 
                    className="chat-back-btn" 
                    onClick={() => setActiveConv(null)}
                    title="Back to conversations"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  </button>
                  <div className="conv-avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                    {activeConv.otherUser?.profilePicture
                      ? <img src={activeConv.otherUser.profilePicture} alt={activeConv.otherUser.name} />
                      : CF.getInitials(activeConv.otherUser?.name || 'U')}
                  </div>
                  <div>
                    <div className="font-bold">{activeConv.otherUser?.name || 'User'}</div>
                    <div className="text-sm text-muted">Re: {activeConv.post?.itemName}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/post-detail?id=${activeConv.postId}`)}
                    >
                      View Post
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleDeleteConversation}
                      disabled={isDeletingConv}
                      title="Delete conversation"
                    >
                      {isDeletingConv ? '⏳' : '🗑️ Delete Chat'}
                    </button>
                  </div>
                </div>

                {/* Resolution bar */}
                {renderResolutionBar()}

                {/* Messages */}
                <div className="messages-area" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {isLoadingMessages ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <div className="spinner-loader" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="empty-state" style={{ margin: 'auto' }}>
                      <div className="empty-icon">💬</div>
                      <div className="empty-title">No messages yet</div>
                      <div className="empty-text">Send the first message!</div>
                    </div>
                  ) : (
                    messages.map(msg => {
                      const senderId = (msg.sender?._id || msg.sender)?.toString();
                      const isMe = senderId === userId;
                      return (
                        <div key={msg._id} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="attachment"
                              style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '6px', cursor: 'zoom-in', display: 'block' }}
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}
                          {msg.text && msg.text !== '📷 Image' && msg.text}
                          {msg.text === '📷 Image' && !msg.image && '📷 Image'}
                          <div className="message-time">{CF.timeAgo(msg.createdAt)}</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <form className="chat-input-area" onSubmit={handleSend}>
                  <button 
                    type="button" 
                    className="icon-btn attachment-btn" 
                    onClick={() => imageInputRef.current.click()} 
                    title="Attach image"
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    {pendingImage && (
                      <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageAttach}
                  />
                  <input
                    type="text"
                    ref={messageInputRef}
                    placeholder={pendingImage ? 'Image attached — add a caption or just Send' : 'Type a message...'}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    autoComplete="off"
                  />
                  <button type="submit" className="btn btn-primary" disabled={isSending || (!text.trim() && !pendingImage)}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <div className="empty-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="empty-title">Select a conversation</div>
                <div className="empty-text">Choose a conversation from the list to start messaging.</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
