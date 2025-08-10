/**
 * Main Workspace Page
 * Demonstrates the complete integrated sidebar + canvas system
 */

import React from 'react'
import WorkspaceLayout from '../components/layout/WorkspaceLayout'

const WorkspacePage: React.FC = () => {
  return (
    <div className="workspace-page">
      <WorkspaceLayout />
    </div>
  )
}

export default WorkspacePage