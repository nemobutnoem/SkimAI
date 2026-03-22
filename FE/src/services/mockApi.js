import { accountMockApi } from './mock/accountMockApi'
import { adminMockApi } from './mock/adminMockApi'
import { analysisMockApi } from './mock/analysisMockApi'
import { authMockApi } from './mock/authMockApi'
import { dbMockApi } from './mock/dbMockApi'
import { expertMockApi } from './mock/expertMockApi'

export const mockApi = {
  ...authMockApi,
  ...analysisMockApi,
  ...expertMockApi,
  ...accountMockApi,
  ...adminMockApi,
  ...dbMockApi,
}
