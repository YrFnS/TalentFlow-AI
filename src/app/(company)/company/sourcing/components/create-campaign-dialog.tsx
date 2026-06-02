// @ts-nocheck
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { mockJobs } from './mock-data';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCampaignName: string;
  setNewCampaignName: (v: string) => void;
  newCampaignJobId: string;
  setNewCampaignJobId: (v: string) => void;
  newCampaignSkills: string;
  setNewCampaignSkills: (v: string) => void;
  newCampaignExperience: string;
  setNewCampaignExperience: (v: string) => void;
  newCampaignLocation: string;
  setNewCampaignLocation: (v: string) => void;
  creating: boolean;
  commonCancel: string;
  ts: Record<string, string>;
  onCreate: () => void;
}

export default function CreateCampaignDialog({
  open,
  onOpenChange,
  newCampaignName,
  setNewCampaignName,
  newCampaignJobId,
  setNewCampaignJobId,
  newCampaignSkills,
  setNewCampaignSkills,
  newCampaignExperience,
  setNewCampaignExperience,
  newCampaignLocation,
  setNewCampaignLocation,
  creating,
  commonCancel,
  ts,
  onCreate,
}: CreateCampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            {ts.createCampaign}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{ts.campaignName}</label>
            <Input
              placeholder={ts.campaignNamePlaceholder}
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{ts.selectJobOptional}</label>
            <Select value={newCampaignJobId} onValueChange={setNewCampaignJobId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={ts.noJobLinked} />
              </SelectTrigger>
              <SelectContent>
                {mockJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{ts.criteriaSkills}</label>
            <Input
              placeholder={ts.criteriaSkillsPlaceholder}
              value={newCampaignSkills}
              onChange={(e) => setNewCampaignSkills(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{ts.criteriaExperience}</label>
              <Input
                type="number"
                placeholder="3"
                value={newCampaignExperience}
                onChange={(e) => setNewCampaignExperience(e.target.value)}
                className="h-9 text-sm"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">{ts.criteriaLocation}</label>
              <Input
                placeholder={ts.criteriaLocationPlaceholder}
                value={newCampaignLocation}
                onChange={(e) => setNewCampaignLocation(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" size="sm">{commonCancel}</Button>
          </DialogClose>
          <Button
            size="sm"
            className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700"
            onClick={onCreate}
            disabled={creating || !newCampaignName.trim()}
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
            {creating ? ts.creating : ts.createBtn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
