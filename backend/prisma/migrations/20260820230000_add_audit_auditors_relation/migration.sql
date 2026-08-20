-- Add audit auditors many-to-many relation
-- Create the join table for AuditSession <-> User (auditors)

CREATE TABLE IF NOT EXISTS "_AuditAuditors" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "_AuditAuditors" 
ADD CONSTRAINT "_AuditAuditors_A_fkey" 
FOREIGN KEY ("A") REFERENCES "AuditSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_AuditAuditors" 
ADD CONSTRAINT "_AuditAuditors_B_fkey" 
FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS "_AuditAuditors_AB_unique" ON "_AuditAuditors"("A", "B");

-- Add index for reverse lookup
CREATE INDEX IF NOT EXISTS "_AuditAuditors_B_index" ON "_AuditAuditors"("B");