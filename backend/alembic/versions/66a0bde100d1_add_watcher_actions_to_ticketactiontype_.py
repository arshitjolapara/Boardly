"""Add watcher actions to ticketactiontype enum

Revision ID: 66a0bde100d1
Revises: 247633c06667
Create Date: 2026-02-09 16:19:14.624069

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66a0bde100d1'
down_revision: Union[str, Sequence[str], None] = '247633c06667'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Postgres doesn't allow ALTER TYPE ... ADD VALUE to run inside a transaction block
    # We commit the current transaction before adding values
    op.execute("COMMIT")
    op.execute("ALTER TYPE ticketactiontype ADD VALUE 'WATCHER_ADDED'")
    op.execute("ALTER TYPE ticketactiontype ADD VALUE 'WATCHER_REMOVED'")


def downgrade() -> None:
    """Downgrade schema."""
    # Enum values cannot be easily removed in Postgres
    pass
