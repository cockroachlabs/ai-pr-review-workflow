"""initial repositories

Revision ID: 8a2d543c9fa0
Revises: 0e22916bf28d
Create Date: 2025-11-13 16:33:18.560144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8a2d543c9fa0'
down_revision: Union[str, None] = '0e22916bf28d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert initial repositories
    op.execute("""
        INSERT INTO repos (repo_name, enabled, team)
        VALUES 
            ('cockroachdb/molt', true, 'molt'),
            ('cockroachdb/replicator', true, 'replicator'),
            ('cockroachlabs/managed-service', true, 'managed-service'),
            ('cockroachlabs/crl-infrastructure', true, 'infrastructure')
        ON CONFLICT (repo_name) DO NOTHING;
    """)


def downgrade() -> None:
    pass
