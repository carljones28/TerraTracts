import { useState } from 'react';
import { X, Share2, Link2, Mail, MessageSquare, Twitter, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareAgentModalProps {
  agent: {
    id: number;
    user?: {
      firstName: string;
      lastName: string;
    };
    profileImage?: string;
    brokerage: string;
    averageRating: string;
    totalReviews: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ShareAgentModal = ({ agent, isOpen, onClose }: ShareAgentModalProps) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/agents/${agent.id}`;
  const shareText = `Check out ${agent.user?.firstName} ${agent.user?.lastName}, a top-rated real estate agent with ${agent.brokerage}. ${parseFloat(agent.averageRating).toFixed(1)} ⭐ rating from ${agent.totalReviews} reviews.`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Recommended Real Estate Agent - ${agent.user?.firstName} ${agent.user?.lastName}`);
    const body = encodeURIComponent(`${shareText}\n\nView their profile: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const tweetText = encodeURIComponent(`${shareText} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`);
  };

  const shareViaFacebook = () => {
    const fbUrl = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`);
  };

  const shareViaLinkedIn = () => {
    const linkedinUrl = encodeURIComponent(shareUrl);
    const linkedinTitle = encodeURIComponent(`${agent.user?.firstName} ${agent.user?.lastName} - Real Estate Agent`);
    const linkedinSummary = encodeURIComponent(shareText);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}&title=${linkedinTitle}&summary=${linkedinSummary}`);
  };

  const shareViaSMS = () => {
    const smsText = `${shareText} ${shareUrl}`;
    
    // Enhanced SMS sharing for both desktop and mobile
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Mobile SMS sharing
      window.location.href = `sms:?&body=${encodeURIComponent(smsText)}`;
    } else {
      // For desktop, try Web Share API first, then fallback to copy
      if (navigator.share) {
        navigator.share({
          title: `${agent.user?.firstName} ${agent.user?.lastName} - Real Estate Agent`,
          text: smsText,
          url: shareUrl
        }).catch((err) => {
          // If sharing fails, copy to clipboard and show instructions
          navigator.clipboard.writeText(smsText).then(() => {
            alert('Link copied to clipboard! You can now paste it into any messaging app.');
          });
        });
      } else {
        // Fallback: Copy to clipboard with user-friendly message
        navigator.clipboard.writeText(smsText).then(() => {
          const userAgent = navigator.userAgent.toLowerCase();
          let instructions = 'Link copied to clipboard! You can now paste it into any messaging app.';
          
          if (userAgent.includes('mac')) {
            instructions = 'Link copied! Open Messages app on your Mac and paste (Cmd+V) to share via SMS.';
          } else if (userAgent.includes('win')) {
            instructions = 'Link copied! Open Your Phone app or WhatsApp Web and paste (Ctrl+V) to share.';
          }
          
          alert(instructions);
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Share Agent Profile</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Agent Preview */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {agent.profileImage ? (
              <img 
                src={agent.profileImage} 
                alt={`${agent.user?.firstName} ${agent.user?.lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {agent.user?.firstName?.charAt(0)}{agent.user?.lastName?.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {agent.user?.firstName} {agent.user?.lastName}
              </h3>
              <p className="text-sm text-gray-600">{agent.brokerage}</p>
              <div className="text-sm text-yellow-600">
                ⭐ {parseFloat(agent.averageRating).toFixed(1)} ({agent.totalReviews} reviews)
              </div>
            </div>
          </div>
        </div>

        {/* Share URL */}
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 truncate">
              {shareUrl}
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>
          )}
        </div>

        {/* Share Options */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Share via</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareViaEmail}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Email</span>
            </button>
            
            <button
              onClick={shareViaSMS}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Text Message</span>
            </button>
            
            <button
              onClick={shareViaTwitter}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Twitter className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-gray-700">Twitter</span>
            </button>
            
            <button
              onClick={shareViaFacebook}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-700">Facebook</span>
            </button>
            
            <button
              onClick={shareViaLinkedIn}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors col-span-2"
            >
              <Linkedin className="h-5 w-5 text-blue-700" />
              <span className="font-medium text-gray-700">LinkedIn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareAgentModal;