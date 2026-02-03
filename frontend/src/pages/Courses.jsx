import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search,  
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  getCourses, 
  addCourse, 
  updateCourse, 
  deleteCourse,
  getStudents 
} from '@/lib/storage';
import { toast } from 'sonner';

export const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    durationUnit: 'months',
    fee: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCourses(getCourses());
    setStudents(getStudents());
  };

  const getEnrolledCount = (courseId) => {
    return students.filter(s => s.courseId === courseId).length;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredCourses = courses.filter(course => {
    return course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           course.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.duration || !formData.fee) {
      toast.error('Please fill in all required fields');
      return;
    }

    const courseData = {
      ...formData,
      duration: parseInt(formData.duration),
      fee: parseFloat(formData.fee)
    };

    if (editingCourse) {
      updateCourse(editingCourse.id, courseData);
      toast.success('Course updated successfully');
    } else {
      addCourse(courseData);
      toast.success('Course added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      duration: course.duration.toString(),
      durationUnit: course.durationUnit || 'months',
      fee: course.fee.toString(),
      description: course.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      const enrolledCount = getEnrolledCount(deleteConfirm.id);
      if (enrolledCount > 0) {
        toast.error(`Cannot delete course with ${enrolledCount} enrolled students`);
        setDeleteConfirm(null);
        return;
      }
      deleteCourse(deleteConfirm.id);
      toast.success('Course deleted successfully');
      setDeleteConfirm(null);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      duration: '',
      durationUnit: 'months',
      fee: '',
      description: ''
    });
  };

  // Calculate totals
  const totalStudents = students.length;
  const totalRevenue = courses.reduce((sum, course) => {
    const enrolled = getEnrolledCount(course.id);
    return sum + (enrolled * course.fee);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage course offerings, durations, and fees
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Update course details' : 'Create a new course for your institution'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Web Development"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="6"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationUnit">Unit</Label>
                  <Select
                    value={formData.durationUnit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, durationUnit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Course Fee (₹) *</Label>
                <Input
                  id="fee"
                  type="number"
                  value={formData.fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                  placeholder="15000"
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description, topics covered, etc."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCourse ? 'Update' : 'Add'} Course
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{courses.length}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-2.5">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Enrolled</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{totalStudents}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2.5">
                <Users className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Revenue</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-2.5">
                <DollarSign className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length === 0 ? (
          <Card className="col-span-full shadow-card">
            <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
              No courses found
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course) => {
            const enrolledCount = getEnrolledCount(course.id);
            return (
              <Card key={course.id} className="group shadow-card transition-all hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(course)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteConfirm(course)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="mt-3 text-lg">{course.name}</CardTitle>
                  {course.description && (
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Duration</span>
                      </div>
                      <Badge variant="secondary">
                        {course.duration} {course.durationUnit}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Enrolled</span>
                      </div>
                      <span className="font-medium text-foreground">{enrolledCount} students</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Course Fee</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(course.fee)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm && getEnrolledCount(deleteConfirm.id) > 0 ? (
                <>This course has {getEnrolledCount(deleteConfirm.id)} enrolled students and cannot be deleted.</>
              ) : (
                <>Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteConfirm && getEnrolledCount(deleteConfirm.id) === 0 && (
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Courses;
