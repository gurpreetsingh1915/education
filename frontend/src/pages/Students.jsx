import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Mail,
  Phone,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  getStudents, 
  addStudent, 
  updateStudent, 
  deleteStudent, 
  getCourses,
  getStudentPayments,
  getStudentAttendance
} from '@/lib/storage';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    joiningDate: '',
    endDate: '',
    status: 'active'
  });

  const loadData = React.useCallback(() => {
    setStudents(getStudents());
    setCourses(getCourses());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown';
  };

  const getCourseDetails = (courseId) => {
    return courses.find(c => c.id === courseId);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.phone.includes(searchQuery);
    const matchesCourse = courseFilter === 'all' || student.courseId === courseFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.courseId || !formData.joiningDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
      toast.success('Student updated successfully');
    } else {
      addStudent(formData);
      toast.success('Student added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      courseId: student.courseId,
      joiningDate: student.joiningDate,
      endDate: student.endDate || '',
      status: student.status || 'active'
    });
    setIsDialogOpen(true);
  };

  const handleView = (student) => {
    setViewingStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteStudent(deleteConfirm.id);
      toast.success('Student deleted successfully');
      setDeleteConfirm(null);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      courseId: '',
      joiningDate: '',
      endDate: '',
      status: 'active'
    });
  };

  const handleCourseChange = (courseId) => {
    setFormData(prev => ({ ...prev, courseId }));
    
    // Auto-calculate end date based on course duration
    if (formData.joiningDate && courseId) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const startDate = parseISO(formData.joiningDate);
        let endDate = new Date(startDate);
        if (course.durationUnit === 'months') {
          endDate.setMonth(endDate.getMonth() + course.duration);
        } else if (course.durationUnit === 'weeks') {
          endDate.setDate(endDate.getDate() + (course.duration * 7));
        } else {
          endDate.setDate(endDate.getDate() + course.duration);
        }
        setFormData(prev => ({ ...prev, endDate: endDate.toISOString().split('T')[0] }));
      }
    }
  };

  const handleJoiningDateChange = (date) => {
    setFormData(prev => ({ ...prev, joiningDate: date }));
    
    // Auto-calculate end date
    if (date && formData.courseId) {
      const course = courses.find(c => c.id === formData.courseId);
      if (course) {
        const startDate = parseISO(date);
        let endDate = new Date(startDate);
        if (course.durationUnit === 'months') {
          endDate.setMonth(endDate.getMonth() + course.duration);
        } else if (course.durationUnit === 'weeks') {
          endDate.setDate(endDate.getDate() + (course.duration * 7));
        } else {
          endDate.setDate(endDate.getDate() + course.duration);
        }
        setFormData(prev => ({ ...prev, endDate: endDate.toISOString().split('T')[0] }));
      }
    }
  };

  const getStudentStats = (studentId) => {
    const payments = getStudentPayments(studentId);
    const attendance = getStudentAttendance(studentId);
    
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const totalPending = payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalDays = attendance.length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return { totalPaid, totalPending, attendanceRate, presentDays, totalDays };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student records, enrollments, and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              <DialogDescription>
                {editingStudent ? 'Update student information' : 'Enter student details to enroll them in a course'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="student@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="course">Course *</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={handleCourseChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.duration} {course.durationUnit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date *</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleJoiningDateChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                {editingStudent && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStudent ? 'Update' : 'Add'} Student
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Student Records</CardTitle>
              <CardDescription>{filteredStudents.length} students found</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span className="text-sm font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{getCourseName(student.courseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.joiningDate ? format(parseISO(student.joiningDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {student.endDate ? format(parseISO(student.endDate), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'active' : student.status === 'completed' ? 'paid' : 'inactive'}>
                          {student.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(student)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirm(student)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-semibold">
                    {viewingStudent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{viewingStudent.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {viewingStudent.email}
                    </div>
                    {viewingStudent.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {viewingStudent.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={viewingStudent.status === 'active' ? 'active' : 'inactive'}>
                  {viewingStudent.status}
                </Badge>
              </div>

              {/* Course & Duration */}
              <div className="grid gap-4 rounded-lg border border-border bg-secondary/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Course</p>
                  <p className="mt-1 font-medium text-foreground">{getCourseName(viewingStudent.courseId)}</p>
                  {getCourseDetails(viewingStudent.courseId) && (
                    <p className="text-sm text-muted-foreground">
                      {getCourseDetails(viewingStudent.courseId).duration} {getCourseDetails(viewingStudent.courseId).durationUnit}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Duration</p>
                  <p className="mt-1 font-medium text-foreground">
                    {viewingStudent.joiningDate && format(parseISO(viewingStudent.joiningDate), 'MMM d, yyyy')}
                    {viewingStudent.endDate && ` - ${format(parseISO(viewingStudent.endDate), 'MMM d, yyyy')}`}
                  </p>
                  {viewingStudent.endDate && (
                    <p className="text-sm text-muted-foreground">
                      {differenceInDays(parseISO(viewingStudent.endDate), new Date()) > 0
                        ? `${differenceInDays(parseISO(viewingStudent.endDate), new Date())} days remaining`
                        : 'Course completed'}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {(() => {
                const stats = getStudentStats(viewingStudent.id);
                return (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalPaid)}</p>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-warning">{formatCurrency(stats.totalPending)}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="rounded-lg border border-border p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{stats.attendanceRate}%</p>
                      <p className="text-xs text-muted-foreground">Attendance ({stats.presentDays}/{stats.totalDays})</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirm?.name}? This will also remove all their attendance and payment records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Students;
