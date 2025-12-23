"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import heroImage from "@/assets/images/hero.png"
import visionImage from "@/assets/images/vision.png"
import { ClipboardCheck, Award, Briefcase, BrainCircuit, Rocket, Laptop2 } from "lucide-react"

const Home = () => {
  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-yellow-300 to-yellow-100 py-16 md:py-24">
        <div className="container mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-12">
          <div className="text-center md:text-left space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900">Welcome To FrameFlow</h1>
            <p className="text-lg text-gray-700 max-w-xl mx-auto md:mx-0">
              We are redefining the way people learn and grow in their careers with innovation, technology, and
              education.
            </p>
            <Link href="/dashboard/courses">
              <Button className="bg-yellow-600 mt-4 hover:bg-yellow-700 px-8 py-3 rounded-lg text-white text-lg font-semibold shadow-md transition-all">
                Get Started
              </Button>
            </Link>
          </div>
          <div className="flex justify-center w-full md:w-1/2">
            <Image
              src={heroImage || "/placeholder.svg"}
              alt="Students learning"
              width={500}
              height={500}
              className="drop-shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 md:px-16 text-center">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Our Vision</h2>
          <div className="flex flex-col md:flex-row items-center gap-16">
            {/* Image Section */}
            <div className="md:w-1/2 flex justify-center">
              <Image
                src={visionImage || "/placeholder.svg"}
                alt="Vision Illustration"
                width={500}
                height={500}
                className="rounded-xl shadow-lg"
              />
            </div>

            {/* Text Content Section */}
            <div className="md:w-1/2 text-left space-y-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                We empower futures by bridging students and colleges through innovation, technology, and education.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🔗</span>
                  <p className="text-lg text-gray-700">
                    <strong>Empowering Connections:</strong> Connecting learners with their ideal institutions
                    seamlessly.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🚀</span>
                  <p className="text-lg text-gray-700">
                    <strong>Innovation at Its Core:</strong> Redefining education with cutting-edge technology.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🌍</span>
                  <p className="text-lg text-gray-700">
                    <strong>Community Development:</strong> Fostering a thriving educational ecosystem.
                  </p>
                </li>
              </ul>
              <p className="text-gray-900 font-semibold text-xl">
                Together, we innovate, inspire, and impact lives—one connection at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">Features We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<ClipboardCheck size={40} className="text-blue-500" />}
              title="Interactive Assessments"
              description="Measure your skills and track your progress in real-time."
            />
            <FeatureCard
              icon={<Award size={40} className="text-yellow-500" />}
              title="Online Certifications"
              description="Earn recognized certifications upon completing courses and internships."
            />
            <FeatureCard
              icon={<Briefcase size={40} className="text-green-500" />}
              title="Employability Skills"
              description="Equipping individuals with the essential skills to thrive in the modern job market."
            />
            <FeatureCard
              icon={<BrainCircuit size={40} className="text-purple-500" />}
              title="AI-Driven Interactions"
              description="Chat with books, upload notes, and ask questions with advanced AI capabilities."
            />
            <FeatureCard
              icon={<Rocket size={40} className="text-red-500" />}
              title="Entrepreneurship Skills"
              description="Empowering aspiring entrepreneurs with the tools and mindset to launch and grow successful ventures."
            />
            <FeatureCard
              icon={<Laptop2 size={40} className="text-indigo-500" />}
              title="Virtual Internships"
              description="Experience real-world challenges and gain certificates for successful completions."
            />
          </div>
        </div>
      </section>

      {/* Partners Section */}
      {/* <section className="py-16"> */}
      {/* <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Partners</h2>
          <div className="flex flex-col md:flex-row justify-center items-stretch gap-8"> */}
      {/* Industry Card */}
      {/* <Card className="flex-1 transition-transform hover:scale-105 group cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                <h3 className="text-2xl font-semibold mb-4">Industry</h3>
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-8 mt-4">
                    <Image src={partner1 || "/placeholder.svg"} alt="Industry Partner 1" width={120} height={60} className="object-contain" />
                    <Image src={partner5 || "/placeholder.svg"} alt="Industry Partner 2" width={120} height={60} className="object-contain" />
                  </div>
                  <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                    <span className="text-gray-500">We are partnered with the best in the industry. Professionals from the industry are our mentors and guide us to make our courses more relevant and practical.</span>
                  </div>
                </div>
              </CardContent>
            </Card> */}
      {/* Institution Card */}
      {/* <Card className="flex-1 transition-transform hover:scale-105 group cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center h-full">
                <h3 className="text-2xl font-semibold mb-4">Institution</h3>
                <div className="flex flex-col items-center justify-center flex-1">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-8 mt-4">
                  <Image src={partner2 || "/placeholder.svg"} alt="Institution Partner 1" width={120} height={60} className="object-contain" />
                    <Image src={partner3 || "/placeholder.svg"} alt="Institution Partner 2" width={120} height={60} className="object-contain" />
                    <Image src={partner4 || "/placeholder.svg"} alt="Institution Partner 3" width={120} height={60} className="object-contain" />
                  </div>
                  <div className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                    <span className="text-gray-500">We are partnered with the best institutions in the country as well as abroad, Contacting abroad institution exposure program to our students to make them more competitive in the job market.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">About FrameFlow</h3>
            <p className="text-gray-400 text-sm">Redefining education through technology and innovation.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Courses
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Certifications
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-400 hover:text-white text-sm">
                  Virtual Internships
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-xl font-bold mb-4">Follow Us</h3>
            <div className="flex flex-col space-y-2">
              <Link href="https://x.com/FrameFlowSkills" className="text-gray-400 hover:text-white text-sm">
                Twitter
              </Link>
              <Link
                href="https://www.linkedin.com/company/frameflow/"
                className="text-gray-400 hover:text-white text-sm"
              >
                LinkedIn
              </Link>
              <Link href="https://www.facebook.com/FrameFlow" className="text-gray-400 hover:text-white text-sm">
                Facebook
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400">
                  <strong>bsradha@frameflow.in</strong>
                </p>
                <p className="text-gray-500 text-xs">Write to us</p>
              </div>
              <div>
                <p className="text-gray-400">
                  <strong>+91 98409 72021</strong>
                </p>
                <p className="text-gray-500 text-xs">Contact us</p>
              </div>
              <div>
                <p className="text-gray-400">
                  <strong>#27, Madley Road, T.Nagar, Chennai- 600017</strong>
                </p>
                <p className="text-gray-400">Tamilnadu, India</p>
                <p className="text-gray-500 text-xs">Address</p>
              </div>
            </div>
          </div>

          {/* Newsletter
          <div>
            <h3 className="text-xl font-bold mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Stay updated with our latest offerings.</p>
            <div className="flex flex-col space-y-2">
              <input type="email" placeholder="Enter your email" className="bg-gray-800 border border-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500" />
              <Button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded">Subscribe</Button>
            </div>
          </div> */}
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center text-gray-400 text-sm mb-4">
            <p className="max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> This Learning Management System (LMS) is built for educational purposes only.
              We referenced several job portals and resources are intended for learning and demonstration purposes.
            </p>
          </div>
          <div className="text-center text-gray-400 text-sm">© 2025 FrameFlow. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <Card className="transition-transform hover:scale-105">
    <CardContent className="flex items-center gap-4 p-6">
      <div className="text-primary">{icon}</div>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-gray-700 text-sm">{description}</p>
      </div>
    </CardContent>
  </Card>
)

export default Home
