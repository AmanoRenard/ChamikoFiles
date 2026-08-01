// 文件信息类型
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  ext: string;
  lastModified: string;
  isImage: boolean;
  isFolder: boolean;
  folderItemCount?: number;
  isVideo?: boolean;
  isAudio?: boolean;
  isText?: boolean;
  isDocument?: boolean;
}

// 应用配置类型
export interface AppConfig {
  storage: {
    path: string;
    maxSpace: number;
    allowedTypes: string;
  };
  display: {
    viewMode: "grid" | "list";
    sortBy: "name" | "size" | "date";
    sortOrder: "asc" | "desc";
  };
  quota: {
    defaultPersonalQuota: number;
    defaultSharedQuota: number;
    maxSharedSpaces: number;
  };
  site: {
    name: string;
    description: string;
  };
  upload: {
    maxFileSize: number;
    maxFilesPerBatch: number;
  };
  security: {
    maxLoginAttempts: number;
    lockoutMinutes: number;
    sessionTimeoutHours: number;
  };
  notification: {
    storageAlertPercent: number;
  };
}

// 存储统计类型
export interface StorageStats {
  usedSpace: number;
  maxSpace: number;
  fileCount: number;
  usagePercent: number;
}

// 文件列表查询参数
export interface FileListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  subpath?: string;
  spaceType?: "personal" | "shared";
  spaceId?: string;
}

// 文件列表响应
export interface FileListResponse {
  files: FileInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 重命名参数
export interface RenameParams {
  oldName: string;
  newName: string;
  subpath?: string;
}

// 创建文件夹参数
export interface MkdirParams {
  folderName: string;
  subpath?: string;
}

// API 通用响应
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 上传进度信息
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

// 序号类型
export type SequenceType = "number" | "timestamp";

// 批量重命名预览项
export interface RenamePreviewItem {
  oldName: string;
  newName: string;
  ext: string;
}

// 批量重命名请求
export interface BatchRenameItem {
  oldName: string;
  newName: string;
}

export interface BatchRenameRequest {
  items: BatchRenameItem[];
  subpath: string;
}

// 批量移动请求
export interface BatchMoveRequest {
  items: string[];
  subpath: string;
  targetSubpath: string;
}

// 批量下载请求
export interface BatchDownloadRequest {
  items: string[];
  subpath: string;
}

// 单个文件移动请求
export interface MoveFileRequest {
  name: string;
  subpath: string;
  targetSubpath: string;
}

// 文件夹列表请求（用于移动时选择目标）
export interface FolderItem {
  name: string;
  path: string;
  hasChildren: boolean;
}

// ============ 用户系统类型 ============

// 用户
export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
}

// 邀请码
export interface InvitationCode {
  id: number;
  code: string;
  createdBy: number;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedBy: number | null;
  usedAt: string | null;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  nickname: string;
  password: string;
  invitationCode?: string;
}

// 当前用户信息响应
export interface AuthUser {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  isAdmin: boolean;
  createdAt: string;
}

// 检查初始化响应
export interface SetupCheckResponse {
  needsSetup: boolean;
}

// 邀请码信息（含剩余有效时间）
export interface InviteInfo {
  code: string;
  expiresAt: string;
  remainingSeconds: number;
  createdAt: string;
}

// ============ 空间系统类型 ============

// 空间类型
export type SpaceType = "personal" | "shared";

// 共享空间
export interface SharedSpace {
  id: string;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

// 空间摘要（用于前端列表展示）
export interface SpaceSummary {
  id: string;
  name: string;
  type: SpaceType;
  role: "owner" | "member" | "personal";
  memberCount: number;
  usedSpace: number;
  maxSpace: number;
  ownerName?: string;
}

// 空间成员
export interface SpaceMember {
  spaceId: string;
  userId: number;
  username: string;
  role: "owner" | "member";
  joinedAt: string;
}

// 空间邀请链接
export interface SpaceInvite {
  id: string;
  spaceId: string;
  code: string;
  createdBy: number;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
  maxUses: number;
  usedCount: number;
}

// 空间邀请信息（返回给前端）
export interface SpaceInviteInfo {
  code: string;
  expiresAt: string;
  remainingSeconds: number;
  createdAt: string;
  usedCount: number;
  maxUses: number;
  isRevoked: boolean;
}

// 用户配额
export interface UserQuota {
  userId: number;
  username: string;
  personalSpaceMaxBytes: number;
  usedSpace?: number;
}

// 创建空间请求
export interface CreateSpaceRequest {
  name: string;
}

// 重命名空间请求
export interface RenameSpaceRequest {
  name: string;
}

// 加入空间请求
export interface JoinSpaceRequest {
  code: string;
}
