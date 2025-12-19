import React, { useState } from 'react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  reason?: string;
}

export default function SupportModal({ isOpen, onClose, userEmail, reason }: SupportModalProps) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userEmail, reason }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setSent(true);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-2">Help & Support</h2>
        <p className="mb-2 text-gray-700">For urgent help, email <a href="mailto:support@rentohub.in" className="text-primary-600 underline">support@rentohub.in</a></p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Describe your issue or request..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
          <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">Send Message</button>
        </form>
        {sent && <p className="text-green-600 mt-2">Your request has been sent to the admin team.</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
