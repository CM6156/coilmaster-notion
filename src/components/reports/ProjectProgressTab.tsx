
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { ProjectProgressChart } from "./ProjectProgressChart";
import { ProjectCard } from "./ProjectCard";

interface ProjectProgressTabProps {
  projects: Project[];
  projectProgressData: {
    name: string;
    progress: number;
  }[];
}

export function ProjectProgressTab({ projects, projectProgressData }: ProjectProgressTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 진행률</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ProjectProgressChart projectProgressData={projectProgressData} />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
