// About Us Page
// Company information, mission, values, and team

import { Link } from 'react-router-dom';
import { Award, Heart, Users, Sparkles, ShoppingBag, Shield, Truck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

const values = [
  {
    icon: Award,
    title: 'Quality First',
    description: 'We curate only the finest products, ensuring every item meets our high standards of excellence.'
  },
  {
    icon: Heart,
    title: 'Customer Care',
    description: 'Your satisfaction is our priority. We\'re committed to providing exceptional service at every step.'
  },
  {
    icon: Sparkles,
    title: 'Luxury Redefined',
    description: 'We believe luxury should be accessible, bringing premium experiences to discerning customers.'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building lasting relationships with our customers, merchants, and partners worldwide.'
  }
];

const features = [
  {
    icon: ShoppingBag,
    title: 'Curated Selection',
    description: 'Handpicked products from trusted merchants'
  },
  {
    icon: Shield,
    title: 'Secure Shopping',
    description: 'Your data and payments are always protected'
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Quick and reliable shipping worldwide'
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: 'Hassle-free return policy for your peace of mind'
  }
];

export default function About() {
  return (
    <Layout>
      <div className="container-luxe py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold mb-6">
            About Lexury
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto">
            We are dedicated to bringing you the finest curated products from around the world, 
            combining luxury, quality, and exceptional service in one seamless shopping experience.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
                At Lexury, we believe that everyone deserves access to quality products that enhance their lives. 
                Our mission is to create a platform where discerning customers can discover and purchase 
                exceptional items from trusted merchants worldwide.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We're committed to providing a seamless shopping experience, exceptional customer service, 
                and a curated selection of products that meet the highest standards of quality and craftsmanship.
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-8 md:p-12">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-xl mb-2">Founded</h3>
                  <p className="text-muted-foreground">2024</p>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Location</h3>
                  <p className="text-muted-foreground">Addis Ababa, Ethiopia</p>
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-2">Our Focus</h3>
                  <p className="text-muted-foreground">
                    Curated luxury goods, exceptional service, and building lasting customer relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
              What Makes Us Different
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the Lexury difference
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6 text-center">
              Our Story
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
              <p>
                Lexury was born from a simple idea: to make luxury accessible to everyone. 
                We recognized that finding quality products shouldn't be a challenge, and that 
                customers deserve a shopping experience that's both elegant and effortless.
              </p>
              <p>
                Starting in 2024, we've built a platform that connects customers with carefully 
                selected merchants who share our commitment to quality and excellence. Every product 
                in our catalog is chosen with care, ensuring that our customers receive only the best.
              </p>
              <p>
                Today, Lexury continues to grow, but our core mission remains the same: to provide 
                exceptional products, outstanding service, and an unparalleled shopping experience 
                that our customers can trust and enjoy.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-secondary rounded-lg p-8 md:p-12 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
            Join the Lexury Community
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Discover exceptional products and experience luxury shopping like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="accent" size="lg">
              <Link to="/products">Shop Now</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

