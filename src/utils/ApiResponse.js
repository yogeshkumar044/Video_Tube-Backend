class ApiResponse {
    constructor(statusCode, data, message = "Success",moredata){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
        this.moredata = moredata
    }
}

export { ApiResponse }