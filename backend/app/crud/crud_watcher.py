from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID

from app.models.ticket_watcher import TicketWatcher

class CRUDWatcher:
    def get_watchers(self, db: Session, ticket_id: UUID) -> List[TicketWatcher]:
        """Get all watchers for a ticket."""
        return db.query(TicketWatcher).filter(TicketWatcher.ticket_id == ticket_id).all()
    
    def add_watcher(
        self, 
        db: Session, 
        ticket_id: UUID, 
        user_id: UUID, 
        added_by: UUID
    ) -> Optional[TicketWatcher]:
        """
        Add a watcher to a ticket.
        Returns the watcher if created, None if already exists.
        """
        # Check if already watching
        existing = db.query(TicketWatcher).filter(
            TicketWatcher.ticket_id == ticket_id,
            TicketWatcher.user_id == user_id
        ).first()
        
        if existing:
            return None
        
        watcher = TicketWatcher(
            ticket_id=ticket_id,
            user_id=user_id,
            added_by=added_by
        )
        db.add(watcher)
        try:
            db.commit()
            db.refresh(watcher)
            return watcher
        except IntegrityError:
            db.rollback()
            return None
    
    def remove_watcher(
        self, 
        db: Session, 
        ticket_id: UUID, 
        user_id: UUID
    ) -> bool:
        """Remove a watcher from a ticket. Returns True if deleted, False if not found."""
        watcher = db.query(TicketWatcher).filter(
            TicketWatcher.ticket_id == ticket_id,
            TicketWatcher.user_id == user_id
        ).first()
        
        if not watcher:
            return False
        
        db.delete(watcher)
        db.commit()
        return True
    
    def is_watching(self, db: Session, ticket_id: UUID, user_id: UUID) -> bool:
        """Check if a user is watching a ticket."""
        return db.query(TicketWatcher).filter(
            TicketWatcher.ticket_id == ticket_id,
            TicketWatcher.user_id == user_id
        ).first() is not None
    
    def auto_watch(
        self,
        db: Session,
        ticket_id: UUID,
        user_id: UUID,
        added_by: UUID
    ) -> Optional[TicketWatcher]:
        """
        Add a watcher only if they're not already watching.
        Used for auto-watch scenarios (creator, assignee, commenter).
        """
        return self.add_watcher(db, ticket_id, user_id, added_by)

crud_watcher = CRUDWatcher()
