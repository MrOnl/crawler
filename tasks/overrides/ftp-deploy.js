/**
 * Created by xTear on 11.09.15.
 */
module.exports = {
    build: {
        auth: {
            host: '178.238.227.197',
            port: 21,
            authKey: 'main',
            authPath: './tasks/config/.ftpconfig'
        },
        src: '<%= buildDir %>/',
        dest: '',
        exclusions: ['<%= buildDir %>/<%= project.name %>/*', '<%= buildDir %>/.DS_Store', '<%= buildDir %>/build*', '<%= buildDir %>/<%= project.name %>/'],
        forceVerbose:true
    }
}