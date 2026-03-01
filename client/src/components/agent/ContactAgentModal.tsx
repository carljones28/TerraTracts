import { useState, useEffect, useRef } from 'react';
import { X, Phone, Mail, MessageCircle, User, MapPin, Clock, CheckCircle, AlertCircle, Send, Zap, Calendar, Shield, Star, Sparkles, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ContactAgentModalProps {
  agent: {
    id: number;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    profileImage?: string;
    brokerage: string;
    licenseNumber?: string;
    responseTime?: number;
    averageRating?: string | number;
    totalReviews?: number;
  };
  property?: {
    id: number;
    title: string;
    price: string;
    location: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ContactAgentModal = ({ agent, property, isOpen, onClose }: ContactAgentModalProps) => {
  const [contactMethod, setContactMethod] = useState<'email' | 'sms'>('email');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: property 
      ? `I'm interested in learning more about "${property.title}" at ${property.location}. Please contact me with more information.`
      : 'I would like to learn more about your services and available properties.',
    contactTime: 'anytime',
    isPreApproved: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (contactMethod === 'sms' && !formData.phone.trim()) {
      errors.phone = 'Phone number is required for SMS contact';
    } else if (formData.phone.trim() && !/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Please provide a more detailed message (at least 10 characters)';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  // Auto-advance steps based on form completion with smooth transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name && formData.email && (contactMethod === 'email' || formData.phone)) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    }, 150); // Small delay for smooth transition

    return () => clearTimeout(timer);
  }, [formData.name, formData.email, formData.phone, contactMethod]);

  // Enhanced success animation
  useEffect(() => {
    if (submitted) {
      setShowSuccessAnimation(true);
    }
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: agent.id,
          propertyId: property?.id,
          contactMethod,
          ...formData,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setCurrentStep(1);
          setFormErrors({});
          setFormData({
            name: '',
            email: '',
            phone: '',
            message: property 
              ? `I'm interested in learning more about "${property.title}" at ${property.location}. Please contact me with more information.`
              : 'I would like to learn more about your services and available properties.',
            contactTime: 'anytime',
            isPreApproved: false
          });
        }, 3000);
      } else {
        setFormErrors({ submit: 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setFormErrors({ submit: 'Failed to send message. Please try again.' });
    }

    setIsSubmitting(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    // Clear phone error when user starts typing
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  const getFieldStatus = (fieldName: string, value: string) => {
    if (formErrors[fieldName]) return 'error';
    if (value && !formErrors[fieldName]) return 'success';
    if (focusedField === fieldName) return 'focus';
    return 'default';
  };

  const getEstimatedResponseTime = () => {
    if (contactMethod === 'sms') return '~30 minutes';
    return `~${agent.responseTime || 2} hours`;
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 pt-20 z-50">
        <div className={`bg-white rounded-3xl p-8 max-w-lg w-full mx-auto text-center shadow-2xl border border-white/20 relative ${
          showSuccessAnimation ? 'animate-in slide-in-from-bottom-4 duration-500' : ''
        }`}>
          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
          {/* Celebration Animation */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    transform: `rotate(${i * 60}deg) translateY(-30px)`,
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </div>
              ))}
            </div>
            
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="h-12 w-12 text-white animate-pulse" />
              <div className="absolute -inset-2 bg-green-400 rounded-full opacity-20 animate-ping"></div>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Message Sent Successfully!
          </h3>
          
          <p className="text-gray-700 mb-2 leading-relaxed font-medium">
            Your message has been delivered to{' '}
            <span className="font-bold text-gray-900">
              {agent.user?.firstName} {agent.user?.lastName}
            </span>
          </p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Timer className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 font-semibold">
              Expected response: {getEstimatedResponseTime()}
            </span>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 mb-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2 shadow-sm">
                <Mail className="h-4 w-4 mr-2" />
                Email delivered
              </Badge>
              {contactMethod === 'sms' && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 shadow-sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  SMS sent
                </Badge>
              )}
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 shadow-sm">
                <Star className="h-4 w-4 mr-2" />
                High priority
              </Badge>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-gray-800 font-bold mb-2">What happens next?</p>
            <div className="text-sm text-gray-700 space-y-1 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>You'll receive a confirmation email</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{agent.user?.firstName} will review your inquiry</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>You'll get a personalized response</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 pt-20 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header with Progress */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Contact Agent
              </h2>
              <p className="text-gray-700 text-sm mt-1 font-medium">Get in touch with your preferred method</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                currentStep >= 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">Contact Info</span>
            </div>
            <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                currentStep >= 2 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">Message Details</span>
            </div>
          </div>
          
          {/* Agent Info */}
          <div className="flex items-center mt-4">
            <div className="relative">
              {agent.profileImage ? (
                <img 
                  src={agent.profileImage} 
                  alt={`${agent.user?.firstName} ${agent.user?.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                  {agent.user && getInitials(agent.user.firstName, agent.user.lastName)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {agent.user?.firstName} {agent.user?.lastName}
              </h3>
              <p className="text-gray-700 font-medium">{agent.brokerage}</p>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center text-sm text-yellow-600">
                  ⭐ {parseFloat(agent.averageRating).toFixed(1)} ({agent.totalReviews} reviews)
                </div>
                <div className="flex items-center text-sm text-gray-600 font-medium">
                  <Clock className="h-4 w-4 mr-1" />
                  Responds in {agent.responseTime || 2}h
                </div>
              </div>
            </div>
          </div>

          {/* Property Info */}
          {property && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mt-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Property Inquiry</h4>
                  <p className="text-gray-700 font-medium">{property.title}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-600">{property.location}</div>
                    <div className="font-bold text-xl text-blue-600">{property.price}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Contact Method Selection */}
          <div className="space-y-4">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              <Zap className="h-5 w-5 inline mr-2 text-blue-600" />
              How would you like to be contacted?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setContactMethod('email')}
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  contactMethod === 'email'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200/50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all ${
                  contactMethod === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <Mail className="h-6 w-6" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Email</div>
                <div className="text-sm text-gray-600 font-medium">Professional & detailed</div>
                <div className="text-xs text-blue-700 mt-2 font-semibold">~{agent.responseTime || 2} hour response</div>
              </button>
              <button
                type="button"
                onClick={() => setContactMethod('sms')}
                className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  contactMethod === 'sms'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg shadow-blue-200/50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all ${
                  contactMethod === 'sms' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Text Message</div>
                <div className="text-sm text-gray-600 font-medium">Quick & convenient</div>
                <div className="text-xs text-green-700 mt-2 font-semibold">~30 min response</div>
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Your Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    onFocus={() => handleFieldFocus('name')}
                    onBlur={handleFieldBlur}
                    className={`w-full px-4 py-4 pr-12 rounded-xl border-2 transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal ${
                      getFieldStatus('name', formData.name) === 'error'
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-200 bg-red-50' 
                        : getFieldStatus('name', formData.name) === 'success'
                        ? 'border-green-400 focus:border-green-600 focus:ring-green-200 bg-green-50'
                        : 'border-gray-300 focus:border-blue-600 hover:border-blue-400 focus:ring-blue-200 bg-white'
                    } focus:ring-4 focus:ring-opacity-40 focus:outline-none transform focus:scale-[1.02]`}
                    placeholder="Enter your full name"
                  />
                  {getFieldStatus('name', formData.name) === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {getFieldStatus('name', formData.name) === 'error' && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                </div>
                {formErrors.name && (
                  <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-800">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                    }}
                    onFocus={() => handleFieldFocus('email')}
                    onBlur={handleFieldBlur}
                    className={`w-full px-4 py-4 pr-12 rounded-xl border-2 transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal ${
                      getFieldStatus('email', formData.email) === 'error'
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-200 bg-red-50' 
                        : getFieldStatus('email', formData.email) === 'success'
                        ? 'border-green-400 focus:border-green-600 focus:ring-green-200 bg-green-50'
                        : 'border-gray-300 focus:border-blue-600 hover:border-blue-400 focus:ring-blue-200 bg-white'
                    } focus:ring-4 focus:ring-opacity-40 focus:outline-none transform focus:scale-[1.02]`}
                    placeholder="your.email@example.com"
                  />
                  {getFieldStatus('email', formData.email) === 'success' && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {getFieldStatus('email', formData.email) === 'error' && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                </div>
                {formErrors.email && (
                  <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                <Phone className="h-4 w-4 inline mr-1 text-blue-600" />
                Phone Number {contactMethod === 'sms' ? '*' : ''}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required={contactMethod === 'sms'}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  onFocus={() => handleFieldFocus('phone')}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-4 pr-12 rounded-xl border-2 transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal ${
                    getFieldStatus('phone', formData.phone) === 'error'
                      ? 'border-red-400 focus:border-red-600 focus:ring-red-200 bg-red-50' 
                      : getFieldStatus('phone', formData.phone) === 'success'
                      ? 'border-green-400 focus:border-green-600 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:border-blue-600 hover:border-blue-400 focus:ring-blue-200 bg-white'
                  } focus:ring-4 focus:ring-opacity-40 focus:outline-none transform focus:scale-[1.02]`}
                  placeholder="(555) 123-4567"
                />
                {getFieldStatus('phone', formData.phone) === 'success' && formData.phone && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
                {getFieldStatus('phone', formData.phone) === 'error' && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                )}
              </div>
              {formErrors.phone && (
                <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.phone}
                </div>
              )}
              {contactMethod === 'sms' && !formErrors.phone && (
                <div className="flex items-center gap-1 text-blue-700 text-sm font-medium">
                  <MessageCircle className="h-3 w-3" />
                  Required for SMS notifications
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                <Calendar className="h-4 w-4 inline mr-1 text-blue-600" />
                Best time to contact
              </label>
              <select
                value={formData.contactTime}
                onChange={(e) => setFormData(prev => ({ ...prev, contactTime: e.target.value }))}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 focus:border-blue-600 hover:border-blue-400 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all duration-200 text-gray-900 font-medium bg-white"
              >
                <option value="anytime">Anytime (24/7 availability)</option>
                <option value="morning">Morning (8AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
                <option value="weekend">Weekends only</option>
              </select>
            </div>
          </div>

          {/* Message Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Your Message</h3>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                Tell {agent.user?.firstName} what you're looking for *
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={5}
                  maxLength={500}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, message: e.target.value }));
                    if (formErrors.message) setFormErrors(prev => ({ ...prev, message: '' }));
                  }}
                  onFocus={() => handleFieldFocus('message')}
                  onBlur={handleFieldBlur}
                  className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-300 resize-none text-gray-900 font-medium placeholder:text-gray-500 placeholder:font-normal ${
                    getFieldStatus('message', formData.message) === 'error'
                      ? 'border-red-400 focus:border-red-600 focus:ring-red-200 bg-red-50' 
                      : getFieldStatus('message', formData.message) === 'success'
                      ? 'border-green-400 focus:border-green-600 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:border-blue-600 hover:border-blue-400 focus:ring-blue-200 bg-white'
                  } focus:ring-4 focus:ring-opacity-40 focus:outline-none transform focus:scale-[1.02]`}
                  placeholder={property 
                    ? `I'm interested in ${property.title}. Please provide more details about the property, pricing, and next steps.`
                    : 'I would like to learn more about your land services. Please contact me to discuss available properties and investment opportunities.'
                  }
                />
                {getFieldStatus('message', formData.message) === 'success' && (
                  <CheckCircle className="absolute right-3 top-4 h-5 w-5 text-green-500" />
                )}
              </div>
              {formErrors.message && (
                <div className="flex items-center gap-1 text-red-700 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  {formErrors.message}
                </div>
              )}
              <div className={`text-right text-xs font-medium transition-colors ${
                formData.message.length > 450 ? 'text-orange-600' : 
                formData.message.length > 400 ? 'text-yellow-700' : 'text-gray-500'
              }`}>
                {formData.message.length}/500 characters
                {formData.message.length > 450 && (
                  <span className="ml-2 text-orange-700 font-semibold">• Almost at limit</span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Additional Information
            </h4>
            
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="preApproved"
                checked={formData.isPreApproved}
                onChange={(e) => setFormData(prev => ({ ...prev, isPreApproved: e.target.checked }))}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="preApproved" className="text-sm text-gray-800 leading-relaxed">
                <span className="font-semibold">I am pre-approved for financing</span>
                <br />
                <span className="text-gray-600 text-xs font-medium">This helps the agent prioritize serious buyers</span>
              </label>
            </div>
          </div>

          {formErrors.submit && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-semibold">{formErrors.submit}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
              disabled={isSubmitting || Object.keys(formErrors).length > 0}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-blue-200 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
                  </div>
                  <span>Sending Message...</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 relative">
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  <span className="font-medium">
                    Send {contactMethod === 'sms' ? 'SMS & Email' : 'Email'}
                  </span>
                  {contactMethod === 'sms' && (
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 text-yellow-300 animate-pulse" />
                      <span className="text-xs text-yellow-200 ml-1">FAST</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
              )}
            </Button>

          </div>
          
          {/* Trust indicators with enhanced design */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-3">Trusted by 10,000+ buyers</p>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium">SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium">Quick Response</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                  <span className="text-xs font-medium">No Spam Ever</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
                <Star className="h-3 w-3 text-yellow-500" />
                <span>4.9/5 average response rating</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactAgentModal;