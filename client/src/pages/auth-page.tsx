import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, CheckCircle, Building, BriefcaseBusiness, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Registration form schema
const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["buyer", "seller", "agent"], {
    required_error: "Please select a role",
  }),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, isAuthenticated, login, register } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // Get return URL from query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/";
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "buyer",
    },
  });
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(returnTo);
    }
  }, [isAuthenticated, user, navigate, returnTo]);
  
  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    await login.mutateAsync(data);
  };
  
  // Handle registration form submission
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    await register.mutateAsync(data);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      <div className="container mx-auto py-8 px-4 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {/* Auth Forms */}
          <div className="w-full max-w-md mx-auto flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome to TerraTracts</h1>
              <p className="text-gray-600 mt-2">
                Sign in to access your account or create a new one to discover the perfect land property.
              </p>
            </div>
            
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>
                      Enter your credentials to access your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username or Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Enter your username or email" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    onClick={togglePasswordVisibility}
                                    tabIndex={-1}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-right">
                          <a href="#" className="text-sm text-primary hover:underline">
                            Forgot your password?
                          </a>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={login.isPending}
                        >
                          {login.isPending ? (
                            <span className="flex items-center">
                              <span className="mr-2">Signing in</span>
                              <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              Sign In <ArrowRight className="ml-2 h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("register")}
                        className="text-primary font-medium hover:underline"
                      >
                        Create one now
                      </button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                      Join TerraTracts to find your perfect property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your first name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    placeholder="Choose a username" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type="email"
                                    placeholder="Enter your email" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Create a strong password" 
                                    className="pl-10" 
                                    {...field} 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    onClick={togglePasswordVisibility}
                                    tabIndex={-1}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Password must be at least 8 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>I am a...</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="buyer">
                                    <div className="flex items-center">
                                      <Home className="h-4 w-4 mr-2" />
                                      <span>Buyer - Looking for properties</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="seller">
                                    <div className="flex items-center">
                                      <Building className="h-4 w-4 mr-2" />
                                      <span>Seller - Listing my properties</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="agent">
                                    <div className="flex items-center">
                                      <BriefcaseBusiness className="h-4 w-4 mr-2" />
                                      <span>Agent - Representing clients</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={register.isPending}
                        >
                          {register.isPending ? (
                            <span className="flex items-center">
                              <span className="mr-2">Creating account</span>
                              <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              Create Account <CheckCircle className="ml-2 h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button 
                        onClick={() => setActiveTab("login")}
                        className="text-primary font-medium hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Marketing/Informational Side */}
          <div className="hidden lg:flex flex-col justify-center">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Discover Your Perfect Property with TerraTracts
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Advanced Property Visualization</h3>
                    <p className="text-gray-600 mt-1">
                      Experience properties in 3D with our advanced visualization tools.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">AI-Powered Property Analysis</h3>
                    <p className="text-gray-600 mt-1">
                      Get insights on property values, risks, and development potential.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Natural Language Search</h3>
                    <p className="text-gray-600 mt-1">
                      Find properties using everyday language with our SmartMatch™ technology.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Personalized Recommendations</h3>
                    <p className="text-gray-600 mt-1">
                      Discover properties that match your preferences and investment goals.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
                <p className="italic text-gray-600">
                  "TerraTracts transformed our property search. The 3D visualizations and AI-powered 
                  insights helped us find our perfect mountain retreat."
                </p>
                <div className="mt-4 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
                    <img 
                      src="https://randomuser.me/api/portraits/women/32.jpg" 
                      alt="Customer" 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Property Buyer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}