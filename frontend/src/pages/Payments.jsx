import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Receipt
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
  getCourses,
  getPayments, 
  addPayment, 
  updatePayment, 
  deletePayment 
} from '@/lib/storage';
import { format, parseISO, isBefore, isAfter, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    installmentNumber: 1,
    notes: ''
  });
  const [recordFormData, setRecordFormData] = useState({
    paidAmount: '',
    paidDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPayments(getPayments());
    setStudents(getStudents());
    setCourses(getCourses());
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const getStudentEmail = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.email || '';
  };

  const getCourseFee = (studentId) => {
    const student = students.find(s => s.id === studentId);
    const course = courses.find(c => c.id === student?.courseId);
    return course?.fee || 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentStatus = (payment) => {
    if (payment.status === 'paid') return 'paid';
    if (payment.status === 'partial') return 'partial';
    if (isBefore(parseISO(payment.dueDate), new Date())) return 'overdue';
    return 'pending';
  };

  const filteredPayments = payments.filter(payment => {
    const studentName = getStudentName(payment.studentId).toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase());
    const status = getPaymentStatus(payment);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort payments by due date
  const sortedPayments = [...filteredPayments].sort((a, b) => 
    new Date(a.dueDate) - new Date(b.dueDate)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.amount || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const paymentData = {
      ...formData,
      amount: parseFloat(formData.amount),
      status: 'pending',
      paidAmount: 0
    };

    if (editingPayment) {
      updatePayment(editingPayment.id, paymentData);
      toast.success('Payment updated successfully');
    } else {
      addPayment(paymentData);
      toast.success('Payment installment added successfully');
    }

    setIsDialogOpen(false);
    resetForm();
    loadData();
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    
    if (!recordFormData.paidAmount || !recordFormData.paidDate) {
      toast.error('Please fill in required fields');
      return;
    }

    const paidAmount = parseFloat(recordFormData.paidAmount);
    const totalPaid = (recordingPayment.paidAmount || 0) + paidAmount;
    const remaining = recordingPayment.amount - totalPaid;
    
    let status = 'partial';
    if (remaining <= 0) {
      status = 'paid';
    }

    updatePayment(recordingPayment.id, {
      paidAmount: totalPaid,
      paidDate: recordFormData.paidDate,
      status,
      notes: recordFormData.notes || recordingPayment.notes
    });

    toast.success(status === 'paid' ? 'Payment completed!' : 'Payment recorded');
    setIsRecordPaymentOpen(false);
    setRecordingPayment(null);
    setRecordFormData({
      paidAmount: '',
      paidDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    loadData();
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      studentId: payment.studentId,
      amount: payment.amount.toString(),
      dueDate: payment.dueDate,
      installmentNumber: payment.installmentNumber || 1,
      notes: payment.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openRecordPayment = (payment) => {
    setRecordingPayment(payment);
    setRecordFormData({
      paidAmount: (payment.amount - (payment.paidAmount || 0)).toString(),
      paidDate: new Date().toISOString().split('T')[0],
      notes: payment.notes || ''
    });
    setIsRecordPaymentOpen(true);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deletePayment(deleteConfirm.id);
      toast.success('Payment deleted successfully');
      setDeleteConfirm(null);
      loadData();
    }
  };

  const resetForm = () => {
    setEditingPayment(null);
    setFormData({
      studentId: '',
      amount: '',
      dueDate: '',
      installmentNumber: 1,
      notes: ''
    });
  };

  // Calculate summary stats
  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);
  
  const overdueAmount = payments
    .filter(p => getPaymentStatus(p) === 'overdue')
    .reduce((sum, p) => sum + (p.amount - (p.paidAmount || 0)), 0);

  const overdueCount = payments.filter(p => getPaymentStatus(p) === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage fee installments and track payment history
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Installment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add New Installment'}</DialogTitle>
              <DialogDescription>
                {editingPayment ? 'Update payment details' : 'Create a new fee installment for a student'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="5000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="installment">Installment #</Label>
                  <Input
                    id="installment"
                    type="number"
                    value={formData.installmentNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, installmentNumber: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
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
                  {editingPayment ? 'Update' : 'Add'} Installment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-success/20 bg-success/5 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-2.5">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
              </div>
              <div className="rounded-lg bg-warning/10 p-2.5">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(overdueAmount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{overdueCount} payments overdue</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-2.5">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Installments</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{payments.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {payments.filter(p => p.status === 'paid').length} completed
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-2.5">
                <Receipt className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment Records</CardTitle>
              <CardDescription>{sortedPayments.length} installments found</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Student</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPayments.map((payment) => {
                    const status = getPaymentStatus(payment);
                    const remaining = payment.amount - (payment.paidAmount || 0);
                    const daysUntilDue = differenceInDays(parseISO(payment.dueDate), new Date());
                    
                    return (
                      <TableRow key={payment.id} className="group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{getStudentName(payment.studentId)}</p>
                            <p className="text-xs text-muted-foreground">{getStudentEmail(payment.studentId)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">#{payment.installmentNumber || 1}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          {remaining > 0 && remaining < payment.amount && (
                            <p className="text-xs text-muted-foreground">
                              Remaining: {formatCurrency(remaining)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{format(parseISO(payment.dueDate), 'MMM d, yyyy')}</p>
                              {status !== 'paid' && (
                                <p className={`text-xs ${daysUntilDue < 0 ? 'text-destructive' : daysUntilDue <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                                  {daysUntilDue < 0 
                                    ? `${Math.abs(daysUntilDue)} days overdue` 
                                    : daysUntilDue === 0 
                                      ? 'Due today' 
                                      : `${daysUntilDue} days left`}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-success">
                            {formatCurrency(payment.paidAmount || 0)}
                          </p>
                          {payment.paidDate && (
                            <p className="text-xs text-muted-foreground">
                              on {format(parseISO(payment.paidDate), 'MMM d')}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {status !== 'paid' && (
                              <Button
                                variant="softSuccess"
                                size="sm"
                                onClick={() => openRecordPayment(payment)}
                              >
                                <DollarSign className="mr-1 h-3.5 w-3.5" />
                                Record Payment
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(payment)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteConfirm(payment)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {recordingPayment && getStudentName(recordingPayment.studentId)}
            </DialogDescription>
          </DialogHeader>
          {recordingPayment && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">{formatCurrency(recordingPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Already Paid</p>
                    <p className="font-semibold text-success">{formatCurrency(recordingPayment.paidAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-semibold text-warning">
                      {formatCurrency(recordingPayment.amount - (recordingPayment.paidAmount || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{format(parseISO(recordingPayment.dueDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Amount Received *</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    value={recordFormData.paidAmount}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                    placeholder="Enter amount"
                    max={recordingPayment.amount - (recordingPayment.paidAmount || 0)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidDate">Payment Date *</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    value={recordFormData.paidDate}
                    onChange={(e) => setRecordFormData(prev => ({ ...prev, paidDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Notes</Label>
                <Textarea
                  id="paymentNotes"
                  value={recordFormData.notes}
                  onChange={(e) => setRecordFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Payment method, reference number, etc."
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRecordPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="success">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
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

export default Payments;
