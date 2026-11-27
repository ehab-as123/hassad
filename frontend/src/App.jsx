import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { PublicLayout, DashboardLayout } from './layouts/Shell'
import { Home, BrowseCrops, BrowseRequests, Login, Register } from './pages/PublicPages'
import { Dashboard, MyCrops, CropForm, MyRequests, RequestForm, SubmitOffer, OffersForRequest, Agreements, AdminPage } from './pages/WorkspacePages'
import { Loading } from './components/UI'

function Protected({ children, roles }) {
 const {user,ready}=useAuth(),location=useLocation()
 if(!ready)return <Loading/>
 if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>
 if(roles&&!roles.includes(user.role))return <Navigate to="/dashboard" replace/>
 return children
}
function App(){
 const {user,ready}=useAuth()
 if(!ready)return <Loading/>
 return <Routes>
  <Route element={<PublicLayout/>}>
   <Route path="/" element={<Home/>}/>
   <Route path="/crops" element={<BrowseCrops/>}/>
   <Route path="/requests" element={<BrowseRequests/>}/>
   <Route path="/login" element={user?<Navigate to="/dashboard"/>:<Login/>}/>
   <Route path="/register" element={user?<Navigate to="/dashboard"/>:<Register/>}/>
  </Route>
  <Route element={<Protected><DashboardLayout/></Protected>}>
   <Route path="/dashboard" element={<Dashboard/>}/>
   <Route path="/agreements" element={<Agreements/>}/>
   <Route path="/requests/:id/offer" element={<Protected roles={['farmer']}><SubmitOffer/></Protected>}/>
   <Route path="/requests/:id/offers" element={<Protected roles={['trader']}><OffersForRequest/></Protected>}/>
   <Route path="/my-crops" element={<Protected roles={['farmer']}><MyCrops/></Protected>}/>
   <Route path="/crops/new" element={<Protected roles={['farmer']}><CropForm/></Protected>}/>
   <Route path="/my-requests" element={<Protected roles={['trader']}><MyRequests/></Protected>}/>
   <Route path="/requests/new" element={<Protected roles={['trader']}><RequestForm/></Protected>}/>
   <Route path="/admin/categories" element={<Protected roles={['admin']}><AdminPage kind="categories"/></Protected>}/>
   <Route path="/admin/regions" element={<Protected roles={['admin']}><AdminPage kind="regions"/></Protected>}/>
  </Route>
  <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>
}
export default App
