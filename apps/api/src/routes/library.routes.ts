import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { LibraryBookController } from '../controllers/libraryBook.controller';
import { LibraryIssueController } from '../controllers/libraryIssue.controller';
import { LibraryReservationController } from '../controllers/libraryReservation.controller';
import { LibraryFineController } from '../controllers/libraryFine.controller';

const router = Router();

router.use(authenticate);

// Books
router.get('/books', LibraryBookController.getBooks);
router.post('/books', requirePermission('LIBRARY', 'CREATE', 'book'), LibraryBookController.createBook);
router.get('/books/:id', LibraryBookController.getBookById);
router.patch('/books/:id', requirePermission('LIBRARY', 'UPDATE', 'book'), LibraryBookController.updateBook);

// Book Copies
router.get('/books/:bookId/copies', requirePermission('LIBRARY', 'READ', 'book_copy'), LibraryBookController.getBookCopies);
router.post('/books/:bookId/copies', requirePermission('LIBRARY', 'CREATE', 'book_copy'), LibraryBookController.createBookCopy);

// Issues & Returns
router.get('/issues', LibraryIssueController.getIssues); // Self-scoped inside controller
router.post('/issues', requirePermission('LIBRARY', 'CREATE', 'issue'), LibraryIssueController.issueBook);
router.patch('/issues/:id/return', requirePermission('LIBRARY', 'UPDATE', 'issue'), LibraryIssueController.returnBook);

// Reservations
router.get('/reservations', LibraryReservationController.getReservations); // Self-scoped inside controller
router.post('/reservations', LibraryReservationController.reserveBook);
router.patch('/reservations/:id/cancel', LibraryReservationController.cancelReservation);

// Fines
router.get('/fines', LibraryFineController.getFines); // Self-scoped inside controller
router.patch('/fines/:id/pay', requirePermission('LIBRARY', 'UPDATE', 'fine'), LibraryFineController.payFine);

export default router;
