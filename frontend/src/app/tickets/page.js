'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, Send, Plus, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ToastProvider';
import { useGetMyTicketsQuery, useCreateTicketMutation, useReplyTicketMutation, useResolveTicketMutation } from '@/store/api';

export default function SupportTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Fetch support tickets
  const { data: ticketsRes, isLoading, refetch } = useGetMyTicketsQuery(undefined, {
    skip: !isAuthenticated || !mounted,
  });
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  const [replyTicket, { isLoading: isReplying }] = useReplyTicketMutation();
  const [resolveTicket] = useResolveTicketMutation();

  const tickets = ticketsRes?.data?.tickets || [];
  const selectedTicket = tickets.find(t => t._id === selectedTicketId);

  const messageContainerRef = React.useRef(null);
  React.useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Please enter both subject and details for your ticket.');
      return;
    }

    try {
      await createTicket({ subject, description, priority }).unwrap();
      setSuccessMsg('Support ticket submitted successfully!');
      setSubject('');
      setDescription('');
      setPriority('medium');
      refetch();
    } catch (err) {
      setErrorMsg(err.data?.message || 'Failed to submit support ticket.');
    }
  };

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!ticketReplyText.trim()) return;
    try {
      await replyTicket({
        id: selectedTicketId,
        text: ticketReplyText.trim(),
      }).unwrap();
      setTicketReplyText('');
      refetch();
      showToast('Reply sent successfully.', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to send reply.', 'error');
    }
  };

  const handleResolveTicket = async () => {
    try {
      await resolveTicket(selectedTicketId).unwrap();
      refetch();
      showToast('Ticket marked resolved successfully.', 'success');
    } catch (err) {
      showToast(err.data?.message || 'Failed to resolve ticket.', 'error');
    }
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', icon: Clock, label: 'Open' },
      in_progress: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', icon: MessageSquare, label: 'In Progress' },
      resolved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', icon: CheckCircle2, label: 'Resolved' },
    };

    const config = badges[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock, label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xxs font-bold border ${config.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPriorityBadge = (prio) => {
    const priorities = {
      low: 'bg-slate-100 text-slate-600',
      medium: 'bg-blue-50 text-blue-600 border border-blue-100',
      high: 'bg-red-50 text-red-600 border border-red-100',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorities[prio] || priorities.medium}`}>
        {prio}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section with Title and Refresh Button */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between mb-8">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-2xl border border-cyan-100 dark:border-cyan-900/40 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Support Tickets</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get support, view active ticket threads, or resolve issues with Daykart support team.</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-450 dark:hover:text-slate-250 rounded-xl transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-4 h-4 animate-hover-spin" />
          </button>
        </div>

        {/* Side-by-Side Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Tickets List */}
          <div className={`${selectedTicketId ? 'hidden lg:block' : 'block'} lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs uppercase text-slate-655 dark:text-slate-455 tracking-wider">Your Inquiries</h4>
              <button
                onClick={() => {
                  setSelectedTicketId(null);
                  setSuccessMsg('');
                  setErrorMsg('');
                }}
                className="bg-secondary hover:bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition shadow-xs active:scale-95"
              >
                New Ticket
              </button>
            </div>

            {isLoading ? (
              <p className="text-xxs text-slate-400 animate-pulse py-4">Loading active tickets...</p>
            ) : tickets.length === 0 ? (
              <p className="text-xxs text-slate-405 italic py-6">No support tickets opened yet.</p>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    onClick={() => {
                      setSelectedTicketId(ticket._id);
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    className={`p-3.5 border rounded-2xl cursor-pointer transition flex justify-between items-center gap-3 ${
                      selectedTicketId === ticket._id
                        ? 'border-secondary bg-cyan-50/10 dark:bg-cyan-950/5'
                        : 'border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-855/10'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-855 dark:text-slate-200 truncate mt-1">{ticket.subject}</h5>
                      <p className="text-[10px] text-slate-400 truncate">
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center justify-center p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-[9px] font-bold text-slate-400">{ticket.messages?.length || 1} msgs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Chat Thread or Creation Form */}
          <div className={`${!selectedTicketId ? 'hidden lg:block' : 'block'} lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm`}>
            {selectedTicketId ? (
              /* Ticket Thread View */
              <div className="space-y-6 animate-fade-in">
                {/* Back button on mobile */}
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="lg:hidden text-xs text-secondary font-bold flex items-center gap-1 mb-2 hover:underline animate-fade-in"
                >
                  &larr; Back to Inquiries
                </button>

                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/40">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                      selectedTicket?.status === 'resolved' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedTicket?.status === 'in_progress' ? 'In Progress' : selectedTicket?.status}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-855 dark:text-slate-200 mt-1">{selectedTicket?.subject}</h4>
                  </div>
                  {selectedTicket?.status !== 'resolved' && (
                    <button
                      onClick={handleResolveTicket}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl text-xxs shadow-sm transition active:scale-95"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>

                {/* Messages Log */}
                <div ref={messageContainerRef} className="space-y-4 max-h-[320px] overflow-y-auto p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 scrollbar-thin">
                  {selectedTicket?.messages?.map((msg, idx) => {
                    const isAdminSender = msg.sender !== user?._id;
                    return (
                      <div key={idx} className={`flex flex-col ${isAdminSender ? 'items-start' : 'items-end'}`}>
                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed font-medium shadow-xs ${
                          isAdminSender 
                            ? 'bg-slate-150 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/20' 
                            : 'bg-secondary text-white rounded-tr-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          <span className={`block text-[9px] mt-1 opacity-70 ${isAdminSender ? 'text-slate-400' : 'text-cyan-100'}`}>
                            {isAdminSender ? 'Support Team' : 'You'} &middot; {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply Form */}
                {selectedTicket?.status !== 'resolved' ? (
                  <form onSubmit={handleReplyTicket} className="flex gap-2">
                    <textarea
                      placeholder="Type your response to support team..."
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      rows={2}
                      className="flex-1 bg-slate-100 dark:bg-slate-855 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-2xl text-xs outline-none transition resize-none dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={isReplying || !ticketReplyText.trim()}
                      className="bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-bold p-3.5 rounded-2xl transition active:scale-95 flex items-center justify-center self-end shadow-md"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <p className="text-xxs text-slate-400 text-center py-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50">
                    This support ticket is closed and resolved. You can no longer send replies to this thread.
                  </p>
                )}
              </div>
            ) : (
              /* Ticket Submission Form */
              <div className="space-y-4 animate-fade-in">
                <h4 className="font-extrabold text-xs uppercase text-slate-655 dark:text-slate-450 tracking-wider">Submit Support Inquiry</h4>
                {successMsg && <p className="text-xxs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">{successMsg}</p>}
                {errorMsg && <p className="text-xxs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-2.5 rounded-xl">{errorMsg}</p>}
                
                <form onSubmit={handleCreateTicket} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Refund issue"
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition dark:text-slate-200"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inquiry Details</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Describe your issue in detail..."
                      className="w-full bg-slate-100 dark:bg-slate-850 border border-transparent focus:border-secondary px-3 py-2 rounded-xl text-xs outline-none transition resize-none dark:text-slate-200"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-secondary hover:bg-cyan-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xxs transition shadow-sm"
                  >
                    {isCreating ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
