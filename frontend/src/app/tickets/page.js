'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { MessageSquare, AlertCircle, Clock, CheckCircle2, Send, Plus, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useGetMyTicketsQuery, useCreateTicketMutation } from '@/store/api';

export default function SupportTicketsPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch support tickets
  const { data: ticketsRes, isLoading, refetch } = useGetMyTicketsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();

  const tickets = ticketsRes?.data?.tickets || [];

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

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
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
        <div className="flex items-center gap-3.5 mb-8">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-secondary rounded-2xl border border-cyan-100 dark:border-cyan-900/40 shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Support Tickets</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Get support, view active ticket threads, or resolve issues with Daykart support team.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Create Ticket Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-secondary" /> Open a New Ticket
            </h3>

            {successMsg && (
              <p className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-xl">
                {successMsg}
              </p>
            )}

            {errorMsg && (
              <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-2.5 rounded-xl">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Ticket Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue with coupon discount refund"
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-1.5">
                  Detailed Explanation
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe your issue with order ID, payments, or seller interactions..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-secondary px-3.5 py-2.5 rounded-xl text-xs outline-none transition dark:text-slate-200 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-secondary hover:bg-cyan-600 text-white font-bold py-3 rounded-xl text-xs shadow-md transition active:scale-98 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> {isCreating ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>

          {/* Ticket Threads */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-secondary" /> Active Support Threads
              </h3>

              {isLoading ? (
                <div className="space-y-4">
                  {Array(2).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-400 italic">No support tickets opened yet. If you face any issues, open your first ticket above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50/35 dark:hover:bg-slate-900/40 transition flex flex-col md:flex-row justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate mt-1">
                          {ticket.subject}
                        </h4>
                        <p className="text-xxs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {ticket.messages?.[0]?.text || ticket.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-end">
                        <span className="text-xxs text-slate-400 font-bold flex items-center gap-1">
                          Messages ({ticket.messages?.length || 0})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
