import mongoose from "mongoose"



mongoose.connect('mongodb://localhost:27017/PF_FSD_UTN')

.then(
  () => {
      console.log('Se establecio la conexion con mongoDB')
    
  }
)
.catch(
  (error) => {
      console.error('La conexion con mongoDB ha fallado', error)
  }
)
.finally( 
  () => {
      console.log('El proceso de conexion con la DB esta finalizado')
  }
)

export default mongoose