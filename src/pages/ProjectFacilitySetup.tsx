import { Building2, FolderKanban } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectSetupContent } from "@/pages/ProjectSetup";
import { FacilityUnitSetupContent } from "@/pages/FacilityUnitSetup";

export default function ProjectFacilitySetup() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects & facilities</h1>
        <p className="text-muted-foreground mt-1">
          Manage project definitions and facility/unit setup in one place.
        </p>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="facilities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <ProjectSetupContent embedded />
        </TabsContent>
        <TabsContent value="facilities">
          <FacilityUnitSetupContent embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

