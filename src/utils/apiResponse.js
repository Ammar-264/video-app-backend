class ApiResponse {
    constructor(
        statusCodde,
        data,
        message = 'success'
    ){
        this.statusCodde = statusCodde
        this.data = data 
        this.message = message
        this.success = statusCodde < 400
    }
}

export default ApiResponse