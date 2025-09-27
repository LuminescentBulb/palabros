import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Globe, Zap, BookOpen, Star } from "lucide-react"
import { auth0 } from "@/lib/auth0"

export default async function HomePage() {
  const session = await auth0.getSession();
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Palabros</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-10 ">
            <a
              href="#features"
              className="text-base font-medium text-white/80 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#dialects"
              className="text-base font-medium text-white/80 hover:text-white transition-colors"
            >
              Dialects
            </a>
            <a
              href="#how-it-works"
              className="text-base font-medium text-white/80 hover:text-white transition-colors"
            >
              How it Works
            </a>

            {session ? (
              <a href="/dashboard">
                <Button
                  size="lg"
                  className="rounded-lg px-6 py-5 font-semibold bg-white shadow-md hover:bg-gray-100"
                >
                  <span className="bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent">
                    Dashboard
                  </span>
                </Button>
              </a>
            ) : (
              <a href="/auth/login">
                <Button
                  size="lg"
                  className="rounded-lg px-6 py-5 font-semibold bg-white shadow-md hover:bg-gray-100"
                >
                  <span className="bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent">
                    Sign In
                  </span>
                </Button>
              </a>
            )}

          </nav>
        </div>
      </header>

      {/* Hero Section with Animated Gradient */}
      <section className="relative overflow-hidden py-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-500 to-indigo-500 opacity-90" />


        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="text-left text-white">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm mb-6 animate-float">
              ⚡ AI-Powered Spanish Learning
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Master Spanish
              </span>{" "}
              <span className="bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
                Through Real
              </span>{" "}
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                Conversation
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8">
              Learn Spanish slang and natural conversation with our AI chatbot. Practice
              with authentic dialects from Mexico, Spain, Argentina, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg text-white bg-black hover:bg-gray-900 transition">
                Start Chatting Now
              </button>
            </div>
          </div>

          {/* Right: Graphic */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Replace with your SVG / image */}
            <div className="w-[300px] h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-white/90 backdrop-blur-lg">
              <img
                src="/chat-preview.png"
                alt="Chatbot Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">{"Why Choose Palabros?"}</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              {"Experience the most natural way to learn Spanish through AI-powered conversations"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{"Real-Time Corrections"}</h3>
                <p className="text-muted-foreground">
                  {
                    "Get instant feedback on your Spanish. Our AI corrects formal language and shows you how natives really speak."
                  }
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{"Multiple Dialects"}</h3>
                <p className="text-muted-foreground">
                  {
                    "Choose from Mexican, Spanish, Argentinian, and other dialects. Learn the slang that matters to you."
                  }
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{"Highlight to Learn"}</h3>
                <p className="text-muted-foreground">
                  {"Tap any word or phrase to get instant explanations, definitions, and cultural context."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dialects Section */}
      <section id="dialects" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">{"Choose Your Spanish Dialect"}</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              {"Each region has its own flavor. Pick the one that matches your goals."}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { country: "Mexico", flag: "🇲🇽", example: '"¿Qué onda, güey?"' },
              { country: "Spain", flag: "🇪🇸", example: '"¿Qué tal, tío?"' },
              { country: "Argentina", flag: "🇦🇷", example: '"¿Cómo andás, che?"' },
              { country: "Colombia", flag: "🇨🇴", example: '"¿Qué más, parcero?"' },
            ].map((dialect) => (
              <Card
                key={dialect.country}
                className="border-2 hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{dialect.flag}</div>
                  <h3 className="text-lg font-semibold mb-2">{dialect.country}</h3>
                  <p className="text-sm text-muted-foreground italic">{dialect.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">{"How Palabros Works"}</h2>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              {"Three simple steps to fluent, natural Spanish conversation"}
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">{"Choose Your Dialect"}</h3>
              <p className="text-muted-foreground">
                {"Select the Spanish-speaking region you want to focus on. Each has unique slang and expressions."}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">{"Start Chatting"}</h3>
              <p className="text-muted-foreground">
                {
                  "Have natural conversations with our AI. It responds with authentic slang and corrects your formal Spanish."
                }
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-accent-foreground text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">{"Learn & Improve"}</h3>
              <p className="text-muted-foreground">
                {"Highlight any phrase for instant explanations. Build your vocabulary naturally through conversation."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">{"Trusted by Language Learners"}</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-primary text-primary" />
              ))}
              <span className="text-lg font-semibold ml-2">{"4.9/5 from 2,000+ learners"}</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah M.",
                role: "College Student",
                quote: '"Finally learning Spanish that people actually use! The slang corrections are game-changing."',
              },
              {
                name: "Carlos R.",
                role: "Business Professional",
                quote:
                  '"Perfect for preparing for my move to Mexico. The Mexican dialect feature is incredibly authentic."',
              },
              {
                name: "Emma L.",
                role: "Travel Enthusiast",
                quote: '"I can actually understand Spanish memes now! This app teaches real, modern Spanish."',
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <p className="text-muted-foreground mb-6 italic">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary via-secondary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground text-balance mb-6">
            {"Ready to Speak Spanish Like a Native?"}
          </h2>
          <p className="text-xl text-primary-foreground/90 text-pretty mb-8">
            {"Join thousands of learners mastering real Spanish conversation with Palabros"}
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
            <MessageCircle className="w-5 h-5 mr-2" />
            {"Start Your Free Trial"}
          </Button>
        </div>
      </section>
    </div>
  )
}
