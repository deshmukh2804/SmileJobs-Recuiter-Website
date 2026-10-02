import React, { useState } from 'react';
import { MessageThread, Candidate } from '../types';
import {
  Send,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Paperclip,
  Phone,
  Video,
  User,
} from 'lucide-react';

interface MessagesViewProps {
  threads: MessageThread[];
  activeCandidateId?: string | null;
  onSendMessage: (threadId: string, text: string) => void;
  onSelectCandidateDrawer: (candidateName: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  threads,
  activeCandidateId,
  onSendMessage,
  onSelectCandidateDrawer,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    threads.find((t) => t.candidateId === activeCandidateId)?.id ||
      threads[0]?.id ||
      ''
  );
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeThread =
    threads.find((t) => t.id === selectedThreadId) || threads[0];

  const quickSnippets = [
    'Would you have 20 minutes for an exploratory chat this Thursday?',
    'We were very impressed by your verified technical project portfolio.',
    'Could you share your updated notice period and expected compensation?',
    'Our team would like to schedule a System Design conversation with you.',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    onSendMessage(activeThread.id, inputText.trim());
    setInputText('');
  };

  const handleInsertSnippet = (snippet: string) => {
    setInputText((prev) => (prev ? `${prev} ${snippet}` : snippet));
  };

  const filteredThreads = threads.filter((t) =>
    t.candidateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-in fade-in duration-200">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
          Recruitment Messaging & Inquiries
        </h1>
        <p className="text-sm text-[#6F687A] mt-1">
          Direct communication with verified talent and scheduled applicants.
        </p>
      </div>

      {/* Two-pane layout */}
      <div className="bg-white rounded-3xl border border-[#E8E3EF] shadow-xs overflow-hidden h-[75vh] flex flex-col md:flex-row">
        {/* Left: Thread List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#E8E3EF] flex flex-col bg-[#FCFCF7]">
          {/* Thread Search */}
          <div className="p-4 border-b border-[#E8E3EF]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#6F687A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate conversations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8E3EF] rounded-xl focus:outline-hidden focus:border-[#42326E]"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EFEAF6]">
            {filteredThreads.map((th) => {
              const isSelected = th.id === activeThread?.id;
              return (
                <div
                  key={th.id}
                  onClick={() => setSelectedThreadId(th.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#EDE6FA]/70' : 'hover:bg-white'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                    style={{ backgroundColor: th.candidateAvatarBg }}
                  >
                    {th.candidateName
                      .split(' ')
                      .map((p) => p[0])
                      .join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#2C1B57] truncate">
                        {th.candidateName}
                      </span>
                      <span className="text-[10px] text-[#6F687A] shrink-0">
                        {th.lastMessageTime}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6F687A] truncate mt-0.5">
                      {th.candidateRole}
                    </div>
                    <p className="text-xs text-[#49454F] truncate mt-1">
                      {th.lastMessage}
                    </p>
                  </div>
                  {th.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#42326E] shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat View */}
        {activeThread ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat header */}
            <div className="p-4 border-b border-[#E8E3EF] flex items-center justify-between bg-[#FCFCF7]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                  style={{ backgroundColor: activeThread.candidateAvatarBg }}
                >
                  {activeThread.candidateName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#2C1B57]">
                    {activeThread.candidateName}
                  </h3>
                  <p className="text-[11px] text-[#6F687A]">
                    {activeThread.candidateRole} • Verified candidate
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectCandidateDrawer(activeThread.candidateName)}
                className="px-3 py-1.5 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-lg transition-all"
              >
                View Dossier
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FCFCF7]/40">
              <div className="text-center my-2">
                <span className="text-[10px] font-bold text-[#6F687A] bg-white border border-[#E8E3EF] px-3 py-1 rounded-full shadow-2xs">
                  Encrypted Recruiter Channel • Smile Jobs Verified
                </span>
              </div>

              {activeThread.messages.map((m) => {
                const isRecruiter = m.sender === 'recruiter';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isRecruiter ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isRecruiter
                          ? 'bg-[#2C1B57] text-white rounded-br-xs shadow-xs'
                          : 'bg-white border border-[#E8E3EF] text-[#29233A] rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-[#6F687A] mt-1 px-1">
                      {m.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick response templates */}
            <div className="px-4 py-2 bg-white border-t border-[#E8E3EF] overflow-x-auto flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#6F687A] shrink-0 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#B29CFE]" />
                Templates:
              </span>
              {quickSnippets.map((snip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInsertSnippet(snip)}
                  className="px-2.5 py-1 bg-[#FCFCF7] hover:bg-[#EDE6FA] text-[11px] font-medium text-[#2C1B57] border border-[#E8E3EF] rounded-lg whitespace-nowrap shrink-0 transition-colors"
                >
                  {snip.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[#E8E3EF] flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeThread.candidateName}...`}
                className="flex-1 text-xs py-2.5 px-3.5 bg-[#FCFCF7] border border-[#E8E3EF] rounded-xl focus:outline-hidden focus:border-[#42326E]"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 bg-[#42326E] hover:bg-[#322554] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#6F687A]">
            Select a candidate thread on the left to start messaging.
          </div>
        )}
      </div>
    </div>
  );
};
