import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

export function ConfigNotice() {
  return (
    <Alert className="mb-6">
      <AlertTitle>Supabase Configuration Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">To use all features of ProjectPilot, you need to configure Supabase. Follow these steps:</p>
        <ol className="list-decimal pl-5 space-y-1 mb-3">
          <li>
            Create a Supabase account at{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              supabase.com
            </a>
          </li>
          <li>Create a new project</li>
          <li>Copy your project URL and anon key from the API settings</li>
          <li>Add them to your .env.local file</li>
          <li>Run the schema.sql script in the Supabase SQL editor</li>
        </ol>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" asChild>
            <a href="https://supabase.com/docs" target="_blank" rel="noopener noreferrer">
              Supabase Docs
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
