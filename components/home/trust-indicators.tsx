import { Truck, Shield, Clock, Award, Phone, RefreshCw } from "lucide-react";

const indicators = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "24-48hrs in Lagos & Abuja",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure transactions",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Customer service hotline",
  },
  {
    icon: Award,
    title: "Quality Products",
    description: "Verified authentic items",
  },
  {
    icon: Clock,
    title: "Same Day Pickup",
    description: "Lagos & Abuja locations",
  },
];

export function TrustIndicators() {
  return (
    <section className="py-12 bg-gray-50 rounded-2xl">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div key={index} className="text-center group">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {indicator.title}
              </h3>
              <p className="text-xs text-gray-600">
                {indicator.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}