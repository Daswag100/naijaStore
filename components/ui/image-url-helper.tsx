"use client";

import { ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ImageUrlHelper() {
  const imageServices = [
    {
      name: "Imgur",
      url: "https://imgur.com",
      description: "Free image hosting, reliable URLs",
      example: "https://i.imgur.com/example.jpg"
    },
    {
      name: "Cloudinary",
      url: "https://cloudinary.com",
      description: "Professional image hosting with optimization",
      example: "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    },
    {
      name: "GitHub",
      url: "https://github.com",
      description: "Free hosting via repository raw files",
      example: "https://raw.githubusercontent.com/user/repo/main/image.jpg"
    },
    {
      name: "Unsplash",
      url: "https://unsplash.com",
      description: "High-quality stock photos",
      example: "https://images.unsplash.com/photo-id?w=800"
    }
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Image URL Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertDescription className="text-xs">
            For best results, use direct image URLs from reliable hosting services. 
            Avoid URLs from social media or sites that require login.
          </AlertDescription>
        </Alert>
        
        <div className="text-xs space-y-2">
          <p className="font-medium">Recommended image hosting services:</p>
          {imageServices.map((service) => (
            <div key={service.name} className="flex items-center justify-between py-1">
              <div>
                <span className="font-medium">{service.name}</span>
                <p className="text-gray-600 text-xs">{service.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(service.url, '_blank')}
                className="h-6 px-2"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-2">
          <p className="text-xs font-medium mb-1">URL Format Examples:</p>
          <div className="text-xs text-gray-600 space-y-1">
            <div>✅ https://i.imgur.com/abc123.jpg</div>
            <div>✅ https://images.unsplash.com/photo-123</div>
            <div>❌ https://facebook.com/photo/123</div>
            <div>❌ https://instagram.com/p/abc123</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}